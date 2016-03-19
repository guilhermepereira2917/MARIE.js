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
    statusInfo = document.getElementById("status-info");

var asm = null,
    sim = null,
    interval = null,
    delay = 1;

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

assembleButton.addEventListener("click", function() {
    window.clearInterval(interval);
    interval = null;
    
    var assembler = new MarieAsm(textArea.value);
    
    try {
        asm = assembler.assemble();
    } catch(e) {
        statusInfo.textContent = e.message;
        statusInfo.className = "error";
        console.error(e);
        return;
    }
    
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
    resetRegisters();
    sim.addEventListener("memwrite", function(e) {
        var cell = document.getElementById("cell" + e.address);
        cell.textContent = hex(e.newCell.contents);
        cell.style.color = 'red';
    });
    
    stepButton.disabled = false;
    microStepButton.disabled = false;
    runButton.disabled = false;
    restartButton.disabled = false;
});

stepButton.addEventListener("click", function() {
    sim.step();
    if (sim.halted) {
        statusInfo.textContent = "Machine halted normally.";
    }
});

microStepButton.addEventListener("click", function() {
    sim.microStep();
    if (sim.halted) {
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
        
        interval = window.setInterval(function() {
            sim.step();
            if (sim.halted) {
                window.clearInterval(interval);
                rangeDelay.disabled = false;
                statusInfo.textContent = "Machine halted normally.";
            }
        }, delay);
    }
});

rangeDelay.addEventListener("input", function() {
    displayDelayMs.textContent = this.value + " ms";
    delay = parseInt(this.value);
});

restartButton.addEventListener("click", function() {
    sim.restart();
    resetRegisters();
    statusInfo.textContent = "Restarted simulator (memory contents are still preserved)";
});

window.onbeforeunload = function() {
    if(textArea.value.trim()) {
        return "MARIE.js currently does not have the ability to save files. If you want to keep this file, please copy the program and paste it in a text editor.";
    }
}
