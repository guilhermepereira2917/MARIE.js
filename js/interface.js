var assembleButton = document.getElementById("assemble"),
    stepButton = document.getElementById("step"),
    microStepButton = document.getElementById("microstep"),
    runButton = document.getElementById("run"),
    range_delay = document.getElementById("range_delay"),
    display_delay_ms = document.getElementById("display_delay_ms"),
    restartButton = document.getElementById("restart"),
    textArea = document.getElementById("program"),
    memoryContainer = document.getElementById("memory-container"),
    memoryHeaders = document.getElementById("memory-headers"),
    memory = document.getElementById("memory"),
    status_info = document.getElementById("status_info");

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
    document.getElementById("ac").innerText = hex(sim.ac);
    document.getElementById("ir").innerText = hex(sim.ir);
    document.getElementById("mar").innerText = hex(sim.mar);
    document.getElementById("mbr").innerText = hex(sim.mbr);
    document.getElementById("pc").innerText = hex(sim.pc);
    document.getElementById("in").innerText = hex(sim.in);
    document.getElementById("out").innerText = hex(sim.out);
}

assembleButton.addEventListener("click", function() {
    window.clearInterval(interval);
    var assembler = new MarieAsm(textArea.value);
    
    try {
        asm = assembler.assemble();
    } catch(e) {
        status_info.innerText = e.message;
        status_info.className = "error";
        console.error(e);
        return;
    }
    
    try {
        sim = new MarieSim(asm);
    } catch(e) {
        status_info.innerText = e.message;
        status_info.className = "error";
        console.error(e);
        return;
    }
    
    status_info.innerText = "Assembled successfully";
    status_info.className = ""; 
    
    sim.addEventListener("regwrite", function(e) {
        document.getElementById(e.register).innerText = hex(e.newValue);
    })
    populateMemoryView(sim);
    resetRegisters();
    sim.addEventListener("memwrite", function(e) {
        var cell = document.getElementById("cell" + e.address);
        cell.innerText = hex(e.newCell.contents);
        cell.style.color = 'red';
    });
    
    stepButton.disabled = false;
    microStepButton.disabled = false;
    runButton.disabled = false;
    restartButton.disabled = false;
});

stepButton.addEventListener("click", function() {
    sim.step();
});

microStepButton.addEventListener("click", function() {
    sim.microStep();
});

runButton.addEventListener("click", function() {
    if (interval) {
        window.clearInterval(interval);
        runButton.value = "Run";
        range_delay.disabled = false;
        status_info.innerText = "Halted at user request.";
    }
    else {
        runButton.value = "Stop";
        status_info.innerText = "Running...";
        range_delay.disabled = true;
        
        interval = window.setInterval(function() {
            sim.step();
            if (sim.halted || sim.current().breakPoint) {
                window.clearInterval(interval);
                range_delay.disabled = false;
                status_info.innerText = "Machine halted normally.";
            }
        }, delay);
    }
});

range_delay.addEventListener("input", function() {
    display_delay_ms.innerText = this.value + " ms";
    delay = parseInt(this.value);
});

restartButton.addEventListener("click", function() {
    sim.restart();
    resetRegisters();
    status_info.innerText = "Restarted simulator (memory contents are still preserved)";
});

window.onbeforeunload = function() {
    if(textArea.value.trim()) {
        return "MARIE.js currently does not have the ability to save files. If you want to keep this file, please copy the program and paste it in a text editor.";
    }
}
