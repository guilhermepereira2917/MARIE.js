var assembleButton = document.getElementById("assemble"),
    stepButton = document.getElementById("step"),
    microStepButton = document.getElementById("microstep"),
    runButton = document.getElementById("run"),
    restartButton = document.getElementById("restart"),
    textArea = document.getElementById("program"),
    memoryContainer = document.getElementById("memory-container"),
    memoryHeaders = document.getElementById("memory-headers"),
    memory = document.getElementById("memory");

var sim = null,
    interval = null;

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
    var asm = assembler.assemble();
    sim = new MarieSim(asm);
    
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
    }
    else {
        runButton.value = "Stop";
        interval = window.setInterval(function() {
            sim.step();
            if (sim.halted || sim.current().breakPoint) {
                window.clearInterval(interval);
            }
        }, 1);
    }
});

restartButton.addEventListener("click", function() {
    sim.restart();
    resetRegisters();
});