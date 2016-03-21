"use strict";

var assembleButton = document.getElementById("assemble"),
    stepButton = document.getElementById("step"),
    microStepButton = document.getElementById("microstep"),
    runButton = document.getElementById("run"),
    rangeDelay = document.getElementById("range-delay"),
    displayDelayMs = document.getElementById("display-delay-ms"),
    restartButton = document.getElementById("restart"),
    textArea = document.getElementById("program"),
    memoryContainer = document.getElementById("memory-container"),
    memoryHeaders = document.getElementById("memory-headers"),
    memory = document.getElementById("memory"),
    statusInfo = document.getElementById("status-info"),
    registerLabel = document.getElementById("register-label"),
    registerLog = document.getElementById("register-log"),
    registerLogOuter = document.getElementById("register-log-outer")

var asm = null,
    sim = null,
    interval = null,
    breaking = false,
    delay = 1;
    
textArea.value = localStorage.getItem("marie-program") || "";
    
var programCodeMirror = CodeMirror.fromTextArea(textArea, {
    mode: "marie",
    lineNumbers: true,
    firstLineNumber: 0,
    lineNumberFormatter: MarieAsm.prototype.lineNumberFormatter
});

programCodeMirror.setSize(400, 400);

function hex(num) {
    var s = "0000" + (num >>> 0).toString(16).toUpperCase();
    return s.substr(s.length - 4);
}

function populateMemoryView(sim) {
    while (memory.firstChild) {
        memory.removeChild(memory.firstChild);
    }
    
    while (memoryHeaders.firstChild) {
        memoryHeaders.removeChild(memoryHeaders.firstChild);
    }
    
    // Populate headers
    var i, j, th, tr, cell, header, classAttributes;
    var headers = document.createElement("tr");
    headers.appendChild(document.createElement("th"));
    for (i = 0; i < 16; i++) {
        th = document.createElement("th");
        th.appendChild(document.createTextNode(hex(i)));
        headers.appendChild(th);
    }
    
    memoryHeaders.appendChild(headers);
        
    // Populate memory cells
    for (i = 0; i < 4096; i += 16) {
        tr = document.createElement("tr");
        
        header = document.createElement("th");
        header.appendChild(document.createTextNode(hex(i)));
        tr.appendChild(header);
                
        for (j = 0; j < 16; j++) {
            cell = document.createElement("td");
            cell.id = "cell" + (i + j);
            
            if(i/16 % 2 == 0) {
                if((i/16 + j) % 2 == 0) {
                    classAttributes = "cell-light-grey";
                } else {
                    classAttributes = "cell-dark-grey";
                }
            } else {
                if((i/16 + j) % 2 == 0) {
                    classAttributes = "cell-white";
                } else {
                    classAttributes = "cell-dark-grey";
                }
            }
            
            cell.setAttribute("class", classAttributes);
            cell.appendChild(document.createTextNode(hex(sim.memory[i + j].contents)));
            tr.appendChild(cell);
        }
        
        memory.appendChild(tr);
    }
    
    memoryContainer.style.display = "inline-block";
}

function resetRegisters() {
    document.getElementById("ac").textContent = hex(sim.ac);
    document.getElementById("ir").textContent = hex(sim.ir);
    document.getElementById("mar").textContent = hex(sim.mar);
    document.getElementById("mbr").textContent = hex(sim.mbr);
    document.getElementById("pc").textContent = hex(sim.pc);
    document.getElementById("in").textContent = hex(sim.in);
    document.getElementById("out").textContent = hex(sim.out);
}

function initializeRegisterLog() {
    while (registerLog.firstChild) {
        registerLog.removeChild(registerLog.firstChild);
    }
}

function updateCurrentLine(clear) {    
    var currentLine = document.getElementsByClassName("current-line");
    while (currentLine.length > 0) {
        currentLine[0].classList.remove("current-line");
    }
    
    var activeBreakPoint = document.getElementsByClassName("active-break-point");
    while (activeBreakPoint.length > 0) {
        activeBreakPoint[0].classList.remove("active-break-point");
    }
    
    if (clear) {
        return;
    }
    
    var line = sim.current().line;
    if (line != null) {
        var lineNumbers = document.getElementsByClassName("CodeMirror-linenumber");
        for (var i = 0; i < lineNumbers.length; i++) {
            if (lineNumbers[i].textContent == line) {
                var node = lineNumbers[i].parentNode.parentNode;
                if (lineNumbers[i].classList.contains("break-point")) {
                    statusInfo.textContent = "Machine paused at break point.";
                    node.classList.add("active-break-point");
                    breaking = true;
                }
                
                node.classList.add("current-line");
                return;
            }
        }
        
    }
}

function runLoop() {
    sim.step();
    updateCurrentLine();
    if (sim.halted) {
        window.clearInterval(interval);
        interval = null;
        runButton.textContent = "Halted";
        runButton.disabled = true;
        statusInfo.textContent = "Machine halted normally.";
        
    }
    else if (breaking) {
        window.clearInterval(interval);
        interval = null;
        runButton.textContent = "Continue";
    }
}

assembleButton.addEventListener("click", function() {
    window.clearInterval(interval);
    interval = null;
    
    var breakPoints = document.getElementsByClassName("break-point");
    while (breakPoints.length > 0) {
        breakPoints[0].classList.remove("break-point");
    }
    
    var assembler = new MarieAsm(programCodeMirror.getValue());
    
    try {
        asm = assembler.assemble();
    } catch(e) {
        statusInfo.textContent = e.message;
        statusInfo.className = "error";
        console.error(e);
        return;
    }
    
    asm.program.forEach(function(statement) {
        var lineNumbers = document.getElementsByClassName("CodeMirror-linenumber");
        for (var i = 0; i < lineNumbers.length; i++) {
            if (lineNumbers[i].textContent == statement.line) {
                lineNumbers[i].classList.add("can-break-point");
                lineNumbers[i].addEventListener("click", function() {
                    statement.breakPoint = !statement.breakPoint;
                    
                    if (statement.breakPoint) {
                        this.classList.add("break-point");
                    }
                    else {
                        this.classList.remove("break-point"); 
                    }
                });
            }
        }
    });
    
    try {
        sim = new MarieSim(asm);
    } catch(e) {
        statusInfo.textContent = e.message;
        statusInfo.className = "error";
        console.error(e);
        return;
    }
    
    statusInfo.textContent = "Assembled successfully";
    statusInfo.className = ""; 
    
    sim.setEventListener("regwrite", function(e) {
        document.getElementById(e.register).textContent = hex(e.newValue);
    })
    
    populateMemoryView(sim);
    initializeRegisterLog();
    resetRegisters();
    
    sim.setEventListener("memwrite", function(e) {
        var cell = document.getElementById("cell" + e.address);
        cell.textContent = hex(e.newCell.contents);
        cell.style.color = 'red';
    });
    
    sim.setEventListener("reglog", function(message) {
        registerLog.appendChild(document.createTextNode(message));
        registerLog.appendChild(document.createElement("br"));
        registerLogOuter.scrollTop = registerLogOuter.scrollHeight;
    });
    
    stepButton.disabled = false;
    microStepButton.disabled = false;
    runButton.disabled = false;
    runButton.textContent = "Run";
    restartButton.disabled = false;
    
    updateCurrentLine(true);
});

stepButton.addEventListener("click", function() {
    if (!sim.halted) {
        sim.step();
        updateCurrentLine();
    }
    else {
        statusInfo.textContent = "Machine halted normally.";
        runButton.textContent = "Halted";
        runButton.disabled = true;
    }
});

microStepButton.addEventListener("click", function() {
    if (!sim.halted) {
        sim.microStep();
        updateCurrentLine();
    }
    else {
        statusInfo.textContent = "Machine halted normally.";
        runButton.textContent = "Halted";
        runButton.disabled = true;
    }
});

runButton.addEventListener("click", function() {
    if (interval) {
        window.clearInterval(interval);
        interval = null;
        runButton.textContent = "Run";
        statusInfo.textContent = "Halted at user request.";
    }
    else {
        runButton.textContent = "Stop";
        statusInfo.textContent = "Running...";
        breaking = false;
        
        interval = window.setInterval(runLoop, delay);
    }
});

rangeDelay.addEventListener("input", function() {
    displayDelayMs.textContent = this.value + " ms";
});

rangeDelay.addEventListener("change", function() {
    delay = parseInt(this.value);
    
    if(interval) {
        window.clearInterval(interval);
        interval = window.setInterval(runLoop, delay);
    }
});

restartButton.addEventListener("click", function() {
    window.clearInterval(interval);
    interval = null;
    sim.restart();
    resetRegisters();
    updateCurrentLine(true);
    runButton.textContent = "Run";
    runButton.disabled = false;
    statusInfo.textContent = "Restarted simulator (memory contents are still preserved)";
});

window.addEventListener("beforeunload", function() {
    window.localStorage.setItem("marie-program", programCodeMirror.getValue());
    return;
});
