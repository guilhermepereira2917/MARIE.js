(function() {
    "use strict";
    var datapath = document.getElementById("datapath-diagram");

    function setDataBus(dpDocument, isOn) {
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
    }

    function setControlBusNumber(dpDocument, readK, writeK) {
       var read_bus = [dpDocument.getElementById("control_read_bus_1"), dpDocument.getElementById("control_read_bus_2"), dpDocument.getElementById("control_read_bus_3")];
       var write_bus = [dpDocument.getElementById("control_write_bus_1"), dpDocument.getElementById("control_write_bus_2"), dpDocument.getElementById("control_write_bus_3")];
       var registers = [dpDocument.getElementById("main_memory"), dpDocument.getElementById("mar_register"), dpDocument.getElementById("pc_register"), dpDocument.getElementById("mbr_register"), dpDocument.getElementById("ac_register"), dpDocument.getElementById("in_register"), dpDocument.getElementById("out_register"), dpDocument.getElementById("ir_register")];
       var i;
        for(var j = 0; j < 3; j++) {
           for(i = 0; i < read_bus[j].childNodes.length; i++) {
                if(read_bus[j].childNodes[i].tagName === "path") {
                    if(readK & 1 << j) {
                        read_bus[j].childNodes[i].style.stroke = "#ff0000";
                    } else {
                        read_bus[j].childNodes[i].style.stroke = "black";
                    }
                }
            }

            for(i = 0; i < write_bus[j].childNodes.length; i++) {
                if(write_bus[j].childNodes[i].tagName === "path") {
                    if(writeK & 1 << j) {
                        write_bus[j].childNodes[i].style.stroke = "#ff0000";
                    } else {
                        write_bus[j].childNodes[i].style.stroke = "black";
                    }
                }
            }
        }

        for(i = 0; i < 8; i++) {
            if(i == readK || i == writeK) {
                registers[i].style.fillOpacity = "1";
            } else {
                registers[i].style.fillOpacity = "0.5";
            }
        }
    }

    window.addEventListener("load", function() {
        datapath = document.getElementById("datapath-diagram");
        /*
        var k = 0;
        setInterval(function() {
            setControlBusNumber(datapath.contentDocument, k, 8 - k);
            setDataBus(datapath.contentDocument, k % 2 === 0);

            k = (k + 1) % 8;
        }, 1000);
        */

    }, false);
}());
