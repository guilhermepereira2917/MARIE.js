var DataPath;

(function() {
    "use strict";

    DataPath = function(element) {
        this.datapath = element;
        this.readRegisterNo = null;
        this.writeRegisterNo = null;

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

    DataPath.prototype.setControlBusNumber = function(register, type) {
        var dpDocument = this.datapath.contentDocument;
        var registerNo = this.registers.indexOf(register) + 1;
        if(type === "read") {
            this.readRegisterNo = registerNo;
        } else if(type === "write") {
            this.writeRegisterNo = registerNo;
        }
        var control_bus = [dpDocument.getElementById("control_" + type + "_bus_3"), dpDocument.getElementById("control_" + type + "_bus_2"), dpDocument.getElementById("control_" + type + "_bus_1")];

        var registerElements = this.registers.map(function(ele) {
            return dpDocument.getElementById(ele + "_register");
        });

        var i;
        for(var j = 0; j < 3; j++) {
           for(i = 0; i < control_bus[j].childNodes.length; i++) {
                if(control_bus[j].childNodes[i].tagName === "path") {
                    if(register !== null && (registerNo) & (1 << j)) {
                        control_bus[j].childNodes[i].style.stroke = "red";
                    } else {
                        control_bus[j].childNodes[i].style.stroke = "black";
                    }
                }
            }
        }

        for(i = 0; i < this.registers.length; i++) {
            if(i === this.readRegisterNo - 1 || i === this.writeRegisterNo - 1) {
                registerElements[i].style.stroke = "red";
            } else {
                registerElements[i].style.stroke = "black";
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
