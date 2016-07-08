/* globals getCompletions, MarieAsm, MarieSim, DataPath, saveAs */

window.addEventListener("load", function() {
    "use strict";

    var assembleButton = document.getElementById("assemble"),
        stepButton = document.getElementById("step"),
        microStepButton = document.getElementById("microstep"),
        stepBackButton = document.getElementById("step-back"),
        runButton = document.getElementById("run"),
        rangeDelay = document.getElementById("range-delay"),
        displayDelayMs = document.getElementById("display-delay-ms"),
        restartButton = document.getElementById("restart"),
        textArea = document.getElementById("program"),
        memoryContainer = document.getElementById("memory-container"),
        memoryHeaders = document.getElementById("memory-headers"),
        memory = document.getElementById("memory"),
        statusInfo = document.getElementById("status-info"),
        outputSelect = document.getElementById("output-select"),
        outputLog = document.getElementById("output-log"),
        outputLogOuter = document.getElementById("output-log-outer"),
        registerLog = document.getElementById("register-log"),
        registerLogOuter = document.getElementById("register-log-outer"),
        watchList = document.getElementById("watch-list"),
        uploadButton = document.getElementById("upload"),
        fileInput = document.getElementById("fileInput"),
        datapathEle = document.getElementById("datapath-diagram"),
        datapathInstructionElement = document.getElementById("datapath-display-instructions");

    const HEX = 0, DEC = 1, ASCII = 2;
    var minDatapathDelay = parseInt(localStorage.getItem("min-datapath-delay")) || 1000;

    var asm = null,
        sim = null,
        stateHistory = [],
        interval = null,
        lastErrorLine = null,
        lastCurrentLine = null,
        lastBreakPointLine = null,
        breaking = false,
        delay = 1,
        microStepping = false,
        running = false,
        waiting = false,
        pausedOnInput = false,
        savedOutput = null,
        outputType = HEX,
        datapath = new DataPath(datapathEle, datapathInstructionElement),
        outputList = [],
        symbolCells = null;

    textArea.value = localStorage.getItem("marie-program") || "";

    var programCodeMirror = CodeMirror.fromTextArea(textArea, {
        mode: "marie",
        lineNumbers: true,
        gutters: ["CodeMirror-linenumbers", "breakpoints"]
    });

    programCodeMirror.on("gutterClick", function(cm, n) {
        var info = cm.lineInfo(n);
        cm.setGutterMarker(n, "breakpoints", info.gutterMarkers ? null : makeMarker());
    });

    programCodeMirror.on("change", function(cm) {
        cm.showHint({
            hint: getCompletions,
            alignWithWord: false,
            completeSingle: false
        });
    });

    function makeMarker() {
        var marker = document.createElement("div");
        marker.style.color = "#07C";
        marker.innerHTML = "●";
        return marker;
    }

    var initialBreakpoints = localStorage.getItem("marie-breakpoints");
    if (initialBreakpoints) {
        JSON.parse(initialBreakpoints).forEach(function(line) {
            var info = programCodeMirror.lineInfo(line);
            programCodeMirror.setGutterMarker(line, "breakpoints", info.gutterMarkers ? null : makeMarker());
        });
    }

    function hex(num, digits) {
        digits = digits || 4;
        var s = "0000" + (num >>> 0).toString(16).toUpperCase();
        return s.substr(s.length - digits);
    }

    function populateMemoryView(sim) {
        while (memory.firstChild) {
            memory.removeChild(memory.firstChild);
        }

        while (memoryHeaders.firstChild) {
            memoryHeaders.removeChild(memoryHeaders.firstChild);
        }

        // Populate headers
        var i, j, th, tr, cell, header;
        var headers = document.createElement("tr");
        th = document.createElement("th");
        headers.appendChild(th);
        for (i = 0; i < 16; i++) {
            th = document.createElement("th");
            th.appendChild(document.createTextNode("+" + hex(i, 1)));
            headers.appendChild(th);
        }

        memoryHeaders.appendChild(headers);

        // Populate memory cells
        for (i = 0; i < 4096; i += 16) {
            tr = document.createElement("tr");

            header = document.createElement("th");
            header.appendChild(document.createTextNode(hex(i, 3)));
            tr.appendChild(header);

            for (j = 0; j < 16; j++) {
                cell = document.createElement("td");
                cell.id = "cell" + (i + j);
                cell.className = "cell";
                cell.appendChild(document.createTextNode(hex(sim.memory[i + j].contents)));
                tr.appendChild(cell);
            }

            memory.appendChild(tr);
        }

        memoryContainer.style.display = "inline-block";
    }

    function populateWatchList(asm, sim) {
        while (watchList.firstChild) {
            watchList.removeChild(watchList.firstChild);
        }

        var symbolCells = {};

        for (var symbol in asm.symbols) {
            var address = asm.symbols[symbol];

            var tr = document.createElement("tr");
            var labelCell = document.createElement("td");
            labelCell.classList.add("watch-list-label");
            labelCell.appendChild(document.createTextNode(symbol));

            var addressCell = document.createElement("td");
            addressCell.classList.add("watch-list-address");
            addressCell.appendChild(document.createTextNode(hex(address, 3)));

            var valueCell = document.createElement("td");
            valueCell.classList.add("watch-list-value");
            valueCell.appendChild(document.createTextNode(hex(sim.memory[address].contents)));

            tr.appendChild(labelCell);
            tr.appendChild(addressCell);
            tr.appendChild(valueCell);

            watchList.appendChild(tr);

            symbolCells[address] = valueCell;
        }

        return symbolCells;
    }

    function convertOutput(value) {
        switch(outputType) {
            case HEX:
                return hex(value);
            case DEC:
                return value;
            case ASCII:
                return String.fromCharCode(value);
            default:
                return "Invalid output type.";
        }
    }

    function repopulateOutputLog() {
        while (outputLog.firstChild) {
            outputLog.removeChild(outputLog.firstChild);
        }

        for(var i = 0; i < outputList.length; i++) {
            outputLog.appendChild(document.createTextNode(convertOutput(outputList[i])));
            outputLog.appendChild(document.createElement("br"));
        }
    }

    function resetRegisters() {
        document.getElementById("ac").textContent = hex(sim.ac);
        document.getElementById("ir").textContent = hex(sim.ir);
        document.getElementById("mar").textContent = hex(sim.mar, 3);
        document.getElementById("mbr").textContent = hex(sim.mbr);
        document.getElementById("pc").textContent = hex(sim.pc, 3);
        document.getElementById("in").textContent = hex(sim.in);
        document.getElementById("out").textContent = hex(sim.out);

        datapath.setAllRegisters([hex(sim.mar, 3), hex(sim.pc, 3), hex(sim.mbr), hex(sim.ac), hex(sim.in), hex(sim.out), hex(sim.ir)]);

        $(".current-pc").removeClass("current-pc");
        $(".current-mar").removeClass("current-mar");
        $(".memory-changed").removeClass("memory-changed");
    }

    function initializeRegisterLog() {
        while (registerLog.firstChild) {
            registerLog.removeChild(registerLog.firstChild);
        }
    }

    function updateCurrentLine(clear) {
        if (lastCurrentLine !== null) {
            programCodeMirror.removeLineClass(lastCurrentLine, "background", "current-line");
            lastCurrentLine = null;
        }

        if (lastBreakPointLine !== null) {
            programCodeMirror.removeLineClass(lastBreakPointLine, "background", "active-break-point");
            lastBreakPointLine = null;
        }

        if (clear) {
            return;
        }

        var current = sim.current();
        var line = current ? current.line : null;
        if (current && line) {
            line--; // Compensate for zero-based lines
            programCodeMirror.addLineClass(line, "background", "current-line");
            lastCurrentLine = line;
            var info = programCodeMirror.lineInfo(line);
            if (info.gutterMarkers) {
                programCodeMirror.addLineClass(line, "background", "active-break-point");
                lastBreakPointLine = line;
                breaking = true;
            }
        }
    }

    function initializeOutputLog() {
        while (outputLog.firstChild) {
            outputLog.removeChild(outputLog.firstChild);
        }
        outputList = [];
    }

    $('#input-dialog').on('shown.bs.modal', function () {
        $('#input-value').focus();
    });

    var placeInputDialog = document.createElement("div");
    placeInputDialog.id = "place-input-dialog";
    document.body.appendChild(placeInputDialog);

    $('#input-dialog').popoverX({
        show: false,
        keyboard: false,
        $target: $("#place-input-dialog"),
        placement: "left",
        closeOtherPopovers: false,
        useOffsetForPos: false
    });

    $('#input-value').keypress(function(e) {
        if(e.which == 13) {
            $('#input-dialog').popoverX('hide');
        }
    });

    function finishInput(output) {
        var type = $('#input-type').val(),
            value = $('#input-value').val();
        switch (type) {
            case ("hex"):
                value = parseInt(value, 16);
                break;
            case ("dec"):
                value = parseInt(value, 10);
                break;
            case ("oct"):
                value = parseInt(value, 8);
                break;
            case ("ascii"):
                value = value.charCodeAt(0);
                break;
        }

        if (!isNaN(value)) {
            $('#input-dialog').on('hidden.bs.modal', function () {
                output(value);
                runLoop(microStepping);
                stopWaiting();
            });
            $('#input-dialog').popoverX('hide');
        }
        else {
            $('#input-error').show({});
        }
    }

    function inputFunc(output) {
        startWaiting();

        $('#input-error').hide();

        $('#input-dialog').popoverX('show');

        $('#input-dialog').off('hidden.bs.modal');
        $('#input-button').off('click');
        $('#input-button-pause').off('click');
        $('#input-value').off('keypress');

        $('#input-value').on('keypress', function(e) {
            if(e.which == 13) {
                finishInput(output);
            }
        });

        $('#input-button').on('click', function() {
            finishInput(output);
        });

        $('#input-pause-button').on('click', function() {
            stopWaiting();
            stop(true);
            setStatus("Halted at user request.");
            runButton.textContent = "Continue";
            $('#input-dialog').popoverX('hide');
            pausedOnInput = true;
            savedOutput = output;
        });
    }

    function outputFunc(value) {
        stateHistory.push({
            type: "output"
        });

        var shouldScrollToBottomOutputLog = outputLogOuter.clientHeight === (outputLogOuter.scrollHeight - outputLogOuter.scrollTop);

        outputList.push(value);

        outputLog.appendChild(document.createTextNode(convertOutput(value)));
        outputLog.appendChild(document.createElement("br"));

        if(shouldScrollToBottomOutputLog) {
            outputLogOuter.scrollTop = outputLogOuter.scrollHeight;
        }
    }

    function setStatus(message, error) {
        statusInfo.textContent = message;

        if(error) {
            statusInfo.className = "error";
            $("#datapath-status-bar").removeClass("alert-info alert-warning").addClass("alert-danger").text(message);
        } else {
            statusInfo.className = "";

            $("#datapath-status-bar").removeClass("alert-danger");

            if(!$('#datapath-status-bar').hasClass("alert-warning")) {
                $("#datapath-status-bar").addClass("alert-info");
            }

            if($("#datapath-status-bar").hasClass("alert-info")) {
                $("#datapath-status-bar").text(message);
            }
        }
    }

    function regLogFunc(message) {
        if(!running || delay >= minDatapathDelay) {
            datapath.appendMicroInstruction(message);
        }

        var shouldScrollToBottomRegisterLog = registerLogOuter.clientHeight === (registerLogOuter.scrollHeight - registerLogOuter.scrollTop);

        registerLog.appendChild(document.createTextNode(message));
        registerLog.appendChild(document.createElement("br"));

        if(shouldScrollToBottomRegisterLog) {
            registerLogOuter.scrollTop = registerLogOuter.scrollHeight;
        }
    }

    function startWaiting() {
        if (interval) {
            window.clearInterval(interval);
            interval = null;
        }
        waiting = true;
        assembleButton.disabled = true;
        stepButton.disabled = true;
        stepBackButton.disabled = true;
        microStepButton.disabled = true;
        restartButton.disabled = true;
    }

    function stopWaiting() {
        waiting = false;
        assembleButton.disabled = false;
        restartButton.disabled = false;
        stepButton.disabled = false;
        stepBackButton.disabled = false;
        microStepButton.disabled = false;
        if (running) {
            run();
        }
    }

    function stop(pause) {
        if (waiting)
            return;

        if (interval) {
            window.clearInterval(interval);
            interval = null;
        }
        if (pause) {
            stepButton.disabled = false;
            microStepButton.disabled = false;
        }
        else {
            runButton.disabled = true;
            stepButton.disabled = true;
            stepBackButton.disabled = true;
            microStepButton.disabled = true;
        }
    }

    function run() {
        if (waiting)
            return;

        if (interval)
            window.clearInterval(interval);
        interval = window.setInterval(runLoop, delay);
        runButton.textContent = "Pause";
        runButton.disabled = false;
        stepButton.disabled = true;
        stepBackButton.disabled = true;
        microStepButton.disabled = true;
        setStatus("Running...");
    }

    function runLoop(micro) {
        microStepping = micro;

        try {
            var step = true;

            if (micro) {
                step = sim.microStep() == "step";
            }
            else {
                sim.step();
            }

            if (step) {
                stateHistory.push({
                    type: "step"
                });
            }
        }
        catch (e) {
            // prevents catastrophic failure if an error occurs (whether it is MARIE or some other JavaScript error)
            setStatus(e.toString(), true);
            lastErrorLine = e.lineNumber;
            if (lastErrorLine) {
                lastErrorLine--;
                programCodeMirror.addLineClass(lastErrorLine, "background", "error-line");
            }

            stop();
            runButton.textContent = "Halted";
            throw e;
        }
        updateCurrentLine();
        stepBackButton.disabled = false;
        if (sim.halted) {
            stop();
            runButton.textContent = "Halted";
            setStatus("Machine halted normally.");
        }
        else if (breaking) {
            stop(true);
            running = false;

            datapathWarning(false);

            runButton.textContent = "Continue";
            setStatus("Machine paused at break point.");
        }
    }

    function datapathWarning(showWarning) {
        if($('#datapath-status-bar').hasClass("alert-danger")) {
            return;
        }

        if(showWarning) {
            $('#datapath-status-bar').removeClass('alert-info').addClass('alert-warning').html("<strong>Note: </strong> Delay is set too low for datapath to update. Increase delay to at least 1000 ms, or set simulator to stepping mode.");
            $("#datapath-display-instructions").css({"opacity": 0.5});
            $("#datapath-diagram").css({"opacity": 0.5});
            datapath.restart();
        } else {
            $('#datapath-status-bar').removeClass('alert-warning').addClass('alert-info').text(statusInfo.textContent);
            $("#datapath-display-instructions").css({"opacity": 1});
            $("#datapath-diagram").css({"opacity": 1});
            if(sim) {
                datapath.setAllRegisters([hex(sim.mar, 3), hex(sim.pc, 3), hex(sim.mbr), hex(sim.ac), hex(sim.in), hex(sim.out), hex(sim.ir)]);
                datapath.showInstruction();
            }
        }
    }

    assembleButton.addEventListener("click", function() {
        stop();
        running = false;

        datapathWarning(false);

        savedOutput = null;
        pausedOnInput = false;

        if (lastErrorLine !== null) {
            programCodeMirror.removeLineClass(lastErrorLine, "background", "error-line");
            lastErrorLine = null;
        }

        var assembler = new MarieAsm(programCodeMirror.getValue());

        try {
            asm = assembler.assemble();
        } catch (e) {
            setStatus(e.toString(), true);
            lastErrorLine = e.lineNumber - 1;
            programCodeMirror.addLineClass(lastErrorLine, "background", "error-line");
            console.error(e);
            return;
        }

        try {
            sim = new MarieSim(asm, inputFunc, outputFunc);
        } catch (e) {
            setStatus(e.message, true);
            console.error(e);
            return;
        }

        datapath.attachSimulator(sim);

        setStatus("Assembled successfully", false);

        sim.setEventListener("regread", function(e) {
            if(!running || delay >= minDatapathDelay) {
                datapath.setControlBus(e.register, "read");
                datapath.setALUBus(e.type);

                datapath.showDataBusAccess(false, running ? delay/2 : 1000);

                stateHistory.push({
                    type: "regread",
                    register: e.register,
                    value: e.value
                });
            }
        });

        sim.setEventListener("regwrite", function(e) {
            document.getElementById(e.register).textContent = hex(e.newValue, e.register == "mar" || e.register == "pc" ? 3 : 4);

            stateHistory.push({
                type: "regwrite",
                register: e.register,
                value: e.oldValue,
                regtype: e.type
            });

            if(!running || delay >= minDatapathDelay) {
                datapath.setRegister(e.register, hex(e.newValue, e.register == "mar" || e.register == "pc" ? 3 : 4));
                datapath.setControlBus(e.register, "write");

                datapath.showDataBusAccess(false, running ? delay/2 : 1000);
            }

            if (e.register == "pc") {
                document.getElementById("cell" + e.oldValue).classList.remove("current-pc");
                document.getElementById("cell" + e.newValue).classList.add("current-pc");
            }

            if (e.register == "mar") {
                document.getElementById("cell" + e.oldValue).classList.remove("current-mar");
                document.getElementById("cell" + e.newValue).classList.add("current-mar");
            }
        });

        populateMemoryView(sim);
        symbolCells = populateWatchList(asm, sim);
        initializeOutputLog();
        initializeRegisterLog();
        resetRegisters();

        sim.setEventListener("memread", function(e) {
            if(!running || delay >= minDatapathDelay) {
                datapath.setControlBus("memory", "read");
                datapath.showDataBusAccess(true, running ? delay/2 : 1000);
            }

            stateHistory.push({
                type: "memread",
                address: e.address
            });
        });

        sim.setEventListener("memwrite", function(e) {
            if(!running || delay >= minDatapathDelay) {
                datapath.setControlBus("memory", "write");
                datapath.showDataBusAccess(true, running ? delay/2 : 1000);
            }

            stateHistory.push({
                type: "memwrite",
                address: e.address,
                value: e.oldCell
            });

            var cell = document.getElementById("cell" + e.address);
            cell.textContent = hex(e.newCell.contents, false);
            cell.classList.add("memory-changed");

            for (var address in symbolCells) {
                if (address == e.address) {
                    symbolCells[address].textContent = hex(e.newCell.contents);
                }
            }
        });

        sim.setEventListener("newinstruction", function() {
            if(!running || delay >= minDatapathDelay) {
                datapath.showInstruction();
            }
        });
        sim.setEventListener("reglog", regLogFunc);
        sim.setEventListener("decode", function(old) {
            datapath.setALUBus("decode");

            stateHistory.push({
                type: "decode",
                opcode: old
            });
        });

        sim.setEventListener("halt", function() {
            stateHistory.push({type: "halt"});
        });
        stepButton.disabled = false;
        microStepButton.disabled = false;
        stepBackButton.disabled = true;
        runButton.disabled = false;
        runButton.textContent = "Run";
        restartButton.disabled = false;

        updateCurrentLine(true);
    });

    stepButton.addEventListener("click", function() {
        runLoop();
    });

    stepBackButton.addEventListener("click", function() {
        var action = stateHistory[stateHistory.length - 1];
        if (action.type != "step")
            sim.step();
        stateHistory.pop();
        action = stateHistory.pop();
        while (action.type != "step" && stateHistory.length > 0) {
            switch (action.type) {
                case "regread":
                    datapath.setControlBus(action.register, "read");
                    datapath.showDataBusAccess(false, 1000);
                    break;
                case "regwrite":
                    var oldValue = sim[action.register],
                        newValue = action.value;
                    sim[action.register] = newValue;

                    datapath.setALUBus(action.regtype);
                    datapath.showDataBusAccess(false, 1000);

                    datapath.setControlBus(action.register, "write");
                    datapath.setRegister(action.register, hex(newValue, action.register == "mar" || action.register == "pc" ? 3 : 4));

                    document.getElementById(action.register).textContent = hex(newValue, action.register == "mar" || action.register == "pc" ? 3 : 4);
                    if (action.register == "pc") {
                        document.getElementById("cell" + oldValue).classList.remove("current-pc");
                        document.getElementById("cell" + newValue).classList.add("current-pc");
                    }

                    if (action.register == "mar") {
                        document.getElementById("cell" + oldValue).classList.remove("current-mar");
                        document.getElementById("cell" + newValue).classList.add("current-mar");
                    }
                    break;
                case "memread":
                    datapath.showDataBusAccess(true, 1000);
                    break;
                case "memwrite":
                    datapath.showDataBusAccess(true, 1000);

                    sim.memory[action.address].contents = action.value;
                    var cell = document.getElementById("cell" + action.address);
                    cell.textContent = hex(action.value, false);
                    for (var address in symbolCells) {
                        if (address == action.address) {
                            symbolCells[address].textContent = hex(action.value);
                        }
                    }
                    break;
                case "output":
                    outputList.pop();
                    repopulateOutputLog();
                    break;
                case "decode":
                    if (action.opcode)
                        sim.opcode = action.opcode;
                    break;
                case "halt":
                    sim.halted = false;
                    break;
            }
            action = stateHistory.pop();
        }

        if (stateHistory.length === 0) {
            stepBackButton.disabled = true;
        }
        else {
            stateHistory.push({type: "step"});
        }

        datapath.showInstruction();
        regLogFunc("----- stepped back -----");
        updateCurrentLine();
    });

    microStepButton.addEventListener("click", function() {
        runLoop(true);
    });

    runButton.addEventListener("click", function() {
        if (running) {
            stop(true);

            datapathWarning(false);

            setStatus("Halted at user request.");
            runButton.textContent = "Continue";
            running = false;
        }
        else {
            breaking = false;
            run();
            runButton.textContent = "Pause";
            running = true;

            if(pausedOnInput) {
                pausedOnInput = false;
                inputFunc(savedOutput);
            }

            if(delay < minDatapathDelay) {
                datapathWarning(true);
            }
        }
    });

    rangeDelay.addEventListener("input", function() {
        displayDelayMs.textContent = this.value + " ms";
    });

    rangeDelay.addEventListener("change", function() {
        delay = parseInt(this.value);

        if(!running || delay >= minDatapathDelay) {
            datapathWarning(false);
        } else if(running) {
            datapathWarning(true);
        }

        if (interval) {
            run();
        }
    });

    restartButton.addEventListener("click", function() {
        stop();
        running = false;
        sim.restart();
        resetRegisters();
        stateHistory = [];
        updateCurrentLine(true);
        runButton.textContent = "Run";
        runButton.disabled = false;
        stepButton.disabled = false;
        stepBackButton.disabled = true;
        microStepButton.disabled = false;
        datapathWarning(false);
        datapath.restart();
        savedOutput = null;
        pausedOnInput = false;
        setStatus("Restarted simulator (memory contents are still preserved)");
    });

    outputSelect.addEventListener("change", function() {
        outputType = this.selectedIndex;
        repopulateOutputLog();
    });

    window.addEventListener("resize", function() {
        handleDatapathUI();
    }, false);

    window.addEventListener("beforeunload", function() {
        window.localStorage.setItem("marie-program", programCodeMirror.getValue());

        var breakpoints = [];
        var count = programCodeMirror.lineCount(), i;
        for (i = 0; i < count; i++) {
            var info = programCodeMirror.lineInfo(i);
            if (info.gutterMarkers) {
                breakpoints.push(i);
            }
        }
        window.localStorage.setItem("marie-breakpoints", JSON.stringify(breakpoints));
        return;
    });

    uploadButton.addEventListener("click", function() {
        fileInput.click();
    });

    $("#undo").click( function(){
	    programCodeMirror.undo();
    });

    $("#redo").click( function(){
        programCodeMirror.redo();
    });

     $("#download").click( function(){
        var text = programCodeMirror.getValue();
        var filename = "code";
        var blob = new Blob([text], {type: "text/plain;charset=utf-8"});
        saveAs(blob, filename+".mas");
    });

    $("#newfilebtn").click( function(){
        var clrtxt = "";
        programCodeMirror.setValue(clrtxt);
        programCodeMirror.clearHistory();
    });

    $("#clear").click(function(){
         $('#newfoldermodal').modal('show');
    });

    $("#cnclnewfile").click( function(){
        $('#newfoldermodal').modal('hide');
    });

    $("#savefile").click( function() {
        var text = programCodeMirror.getValue();
        var filename = "code";
        var blob = new Blob([text], {type: "text/plain;charset=utf-8"});
        saveAs(blob, filename+".mas");
    });

    $("#fileInput").change(function() {
        var file = fileInput.files[0];
        var reader = new FileReader();

        reader.onload = function() {
            programCodeMirror.setValue(reader.result);
        };
        reader.readAsText(file);
    });

    $("#dpath-menu").click(function() {
        if(window.location.hash === "#datapath") {
            window.location.hash = "";
        } else {
            window.location.hash = "#datapath";
        }
    });

    $("#close-datapath").click(function() {
        window.location.hash = "";
    });

    function handleDatapathUI() {
        if(window.location.hash === "#datapath") {
            if(!datapath.loaded) {
                console.warn("DataPath SVG object has not loaded yet.");

                datapath.onLoad = function() {
                    handleDatapathUI();
                };
                return;
            }

            $("#datapath-tick").show();

            var dpBoundingRect = datapath.datapath.getBoundingClientRect();
            var boundingRect = datapath.datapath.contentDocument
                                                .getElementById("in_register")
                                                .getBoundingClientRect();
            $("#place-input-dialog").css({
                top: dpBoundingRect.top + boundingRect.top,
                left: dpBoundingRect.left + boundingRect.left,
                width: boundingRect.width,
                height: boundingRect.height
            });
        } else {
            var inBoundingRect = document.getElementById("in").getBoundingClientRect();

            $("#datapath-tick").hide();
            $("#place-input-dialog").css({
                top: inBoundingRect.top,
                left: inBoundingRect.left,
                width: inBoundingRect.width,
                height: inBoundingRect.height
            });
        }

        $("#input-dialog").popoverX("refreshPosition");
    }

    handleDatapathUI();

    $(window).on('hashchange', function() {
        handleDatapathUI();
    });

    $("body").removeClass("preload");
});
