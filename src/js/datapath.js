var DataPath;

(function() {
    "use strict";

    DataPath = function(element) {
        this.datapath = element;
        this.readRegisterNo = null;
        this.writeRegisterNo = null;

        this.isMemoryRead = false;
        this.isMemoryWrite = false;

        this.registers = ["mar", "pc", "mbr", "ac", "in", "out", "ir"];
    };

    DataPath.prototype.setDataBus = function(dpDocument, isOn) {
        var data_bus = dpDocument.getElementById("data_bus");

        for(var i = 0; i < data_bus.childNodes.length; i++) {
            if(data_bus.childNodes[i].tagName == "rect") {
                if(isOn) {
                    data_bus.childNodes[i].style.fillOpacity = "1";
                } else {
                    data_bus.childNodes[i].style.fillOpacity = "0.5";
                }
            }
        }
    };

    DataPath.prototype.setControlBus = function(register, type) {
        var dpDocument = this.datapath.contentDocument;
        var registerIndex = this.registers.indexOf(register);

        var mainMemory = dpDocument.getElementById("main_memory");
        var memoryReadWire = dpDocument.getElementById("memory_read_wire");
        var memoryWriteWire = dpDocument.getElementById("memory_write_wire");

        if(type === "read") {
            this.readRegisterIndex = registerIndex;
        } else if(type === "write") {
            this.writeRegisterIndex = registerIndex;
        }
        var control_bus = [dpDocument.getElementById("control_" + type + "_bus_3"), dpDocument.getElementById("control_" + type + "_bus_2"), dpDocument.getElementById("control_" + type + "_bus_1")];

        var registerElements = this.registers.map(function(ele) {
            return dpDocument.getElementById(ele + "_register");
        });

        var i;
        for(var j = 0; j < 3; j++) {
           for(i = 0; i < control_bus[j].childNodes.length; i++) {
                if(control_bus[j].childNodes[i].tagName === "path") {
                    if(register !== null && (registerIndex + 1) & (1 << j)) {
                        if(type === "read") {
                            control_bus[j].childNodes[i].style.stroke = "blue";
                        } else if(type == "write") {
                            control_bus[j].childNodes[i].style.stroke = "red";
                        }
                    } else {
                        control_bus[j].childNodes[i].style.stroke = "black";
                    }
                }
            }
        }

        if(this.isMemoryRead && type === "read") {
            this.isMemoryRead = false;
            memoryReadWire.style.stroke = "black";
            mainMemory.style.stroke = "black";
        } else if (this.isMemoryWrite && type === "write") {
            this.isMemoryWrite = false;
            memoryWriteWire.style.stroke = "black";
            mainMemory.style.stroke = "black";
        }

        if(register === null) {
            if(type === "read") {
                mainMemory.style.stroke = "blue";
                memoryReadWire.style.stroke = "blue";
                this.isMemoryRead = true;
            } else if(type === "write") {
                mainMemory.style.stroke = "red";
                memoryWriteWire.style.stroke = "red";
                this.isMemoryWrite = true;
            }
        } else {
            for(i = 0; i < this.registers.length; i++) {
                if(i === this.readRegisterIndex && type === "read") {
                    registerElements[i].style.stroke = "blue";
                    console.log("huzzah");
                } else if(i === this.writeRegisterIndex && type === "write") {
                    registerElements[i].style.stroke = "red";
                }
                else if(i !== this.readRegisterIndex && i !== this.writeRegisterIndex) {
                    registerElements[i].style.stroke = "black";
                }
            }
        }
    };

    DataPath.prototype.setAllDatapathRegisters = function(registers) {
        var self = this;
        this.registers.map(function(ele, index) {
            self.datapath.contentDocument.getElementById(ele + "_register_text")
                .childNodes[0].childNodes[0].textContent = registers[index];
        });
    };

    DataPath.prototype.setDatapathRegister = function(register, value) {
        this.datapath.contentDocument.getElementById(register + "_register_text").childNodes[0].childNodes[0].textContent = value;
    };
}());
