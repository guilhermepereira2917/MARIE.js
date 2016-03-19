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
    registerLog = document.getElementById("register-log");

var asm = null,
    sim = null,
    interval = null,
    breaking = false,
    delay = 1;
    
var programCodeMirror = CodeMirror.fromTextArea(textArea,
    {
        lineNumbers: true,
        firstLineNumber: 0,
        lineNumberFormatter: MarieAsm.prototype.lineFormatter
    }
);

programCodeMirror.setSize(800, 400);

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
    var headers = document.createElement("TR");
    headers.appendChild(document.createElement("TH"));
    for (var i = 0; i < 16; i++) {
        var th = document.createElement("TH");
        th.appendChild(document.createTextNode(hex(i)));
        headers.appendChild(th);
    }
    
    memoryHeaders.appendChild(headers);
    
    // Populate memory cells
    for (var i = 0; i < 4096; i += 16) {
        var tr = document.createElement("TR");
        
        var header = document.createElement("TH");
        header.appendChild(document.createTextNode(hex(i)));
        tr.appendChild(header);
        
        for (var j = 0; j < 16; j++) {
            var cell = document.createElement("TD");
            cell.id = "cell" + (i + j);
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
    registerLabel.style.display = "block";
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
    
    sim.addEventListener("regwrite", function(e) {
        document.getElementById(e.register).textContent = hex(e.newValue);
    })
    populateMemoryView(sim);
    initializeRegisterLog();
    resetRegisters();
    sim.addEventListener("memwrite", function(e) {
        var cell = document.getElementById("cell" + e.address);
        cell.textContent = hex(e.newCell.contents);
        cell.style.color = 'red';
    });
    sim.addEventListener("reglog", function(message) {
        registerLog.appendChild(document.createTextNode(message));
        registerLog.appendChild(document.createElement("BR"));
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
    }
});

microStepButton.addEventListener("click", function() {
    if (!sim.halted) {
        sim.microStep();
        updateCurrentLine();
    }
    else {
        statusInfo.textContent = "Machine halted normally.";
    }
});

runButton.addEventListener("click", function() {
    if (interval) {
        window.clearInterval(interval);
        interval = null;
        runButton.textContent = "Run";
        rangeDelay.disabled = false;
        statusInfo.textContent = "Halted at user request.";
    }
    else {
        runButton.textContent = "Stop";
        statusInfo.textContent = "Running...";
        rangeDelay.disabled = true;
        breaking = false;
        
        interval = window.setInterval(function() {
            sim.step();
            updateCurrentLine();
            if (sim.halted) {
                window.clearInterval(interval);
                interval = null;
                rangeDelay.disabled = false;
                statusInfo.textContent = "Machine halted normally.";
            }
            else if (breaking) {
                window.clearInterval(interval);
                interval = null;
                rangeDelay.disabled = false;
                runButton.textContent = "Continue";
                statusInfo.textContent = "Running...";
            }
        }, delay);
    }
});

rangeDelay.addEventListener("input", function() {
    displayDelayMs.textContent = this.value + " ms";
    delay = parseInt(this.value);
});

restartButton.addEventListener("click", function() {
    window.clearInterval(interval);
    interval = null;
    sim.restart();
    resetRegisters();
    updateCurrentLine(true);
    runButton.textContent = "Run";
    rangeDelay.disabled = false;
    statusInfo.textContent = "Restarted simulator (memory contents are still preserved)";
});

window.onbeforeunload = function() {
    if(programCodeMirror.getValue().trim()) {
        return "MARIE.js currently does not have the ability to save files. If you want to keep this file, please copy the program and paste it in a text editor.";
    }
}
