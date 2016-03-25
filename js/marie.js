"use strict";

function MarieSimError(name, message) {
    this.name = name || "MarieSimError";
    this.message = message;
    this.stack = (new Error()).stack;
    this.toString = function() {
        return [name, ": ", message].join("");
    };
}

MarieSimError.prototype = Object.create(Error.prototype);
MarieSimError.constructor = MarieSimError;

function MarieSim(assembled, inputFunc, outputFunc) {
    this.memory = [];
    this.origin = assembled.origin;
    
    this.restart();
    
    this.inputCallback = inputFunc || function() {
        return parseInt(window.prompt("Input hexadecimal value.", 0), 16) & 0xFFFF;
    };
    
    this.outputCallback = outputFunc || function(value) {
        window.alert((value >>> 0).toString(16));
    };
    
    this.halted = false;
    
    while (this.memory.length < assembled.origin) {
        this.memory.push({
            contents: 0x0000
        });
    }
    
    Array.prototype.push.apply(this.memory, assembled.program);
   
    if (this.memory.length > 0xFFF) {
        throw new MarieSimError("Insufficent memory error", "Failed to load program.");
    }
    
    while (this.memory.length <= 0xFFF) {
        this.memory.push({
            contents: 0x0000
        });
    }
}

MarieSim.prototype.setEventListener = function(event, callback) {
    switch (event) {
        case "memread":
            this.onMemRead = callback;
            break;
        case "memwrite":
            this.onMemWrite = callback;
            break;
        case "regread":
            this.onRegRead = callback;
            break;
        case "regwrite":
            this.onRegWrite = callback;
            break;
        case "reglog":
            this.onRegLog = callback;
            break;
    }
};

MarieSim.prototype.current = function() {
    // This compensates for PC being incremented after fetch
    return this.memory[this.pc - 1];
};

MarieSim.prototype.regSet = function(target, source, mask) {
    if (source == "m") {
        var oldValue = this[target];
        this[target] = this.memory[this.mar].contents;
        if (this.onRegLog) {
            this.onRegLog([
                target.toUpperCase(),
                "←",
                "M[MAR]"
            ].join(" "));
        }
        
        if (this.onMemRead) {
            this.onMemRead.call(this, {
                address: this.mar
            });
        }
        
        if (this.onRegWrite) {
            this.onRegWrite.call(this, {
                register: target,
                oldValue: oldValue,
                newValue: this[target]
            });
        }
    }
    else if (target == "m") {
        var oldCell = this.memory[this.mar].contents;
        
        this.memory[this.mar] = {
            contents: this[source]
        };
        
        if (this.onRegLog) {
            this.onRegLog([
                "M[MAR]",
                "←",
                source.toUpperCase()
            ].join(" "));
        }
        
        if (this.onRegRead) {
            this.onRegRead.call(this, {
                register: source,
                value: this[source]
            });
        }
        
        if (this.onMemWrite) {
            this.onMemWrite.call(this, {
                address: this.mar,
                oldCell: oldCell,
                newCell: this.memory[this.mar]
            });
        }
    }
    else {
        var src = typeof source == "string" ? this[source] : source;
        var msk = mask !== undefined ? mask : 0xFFFF;
        
        var oldValue = this[target];
        
        this[target] = src & msk;
        
        if (this.onRegLog) {
            if (mask === undefined) {
                this.onRegLog([
                    target.toString().toUpperCase(),
                    "←",
                    source.toString(16).toUpperCase()
                ].join(" "));
            }
            else {
                this.onRegLog([
                    target.toString().toUpperCase(),
                    "←",
                    source.toString(16).toUpperCase(),
                    "&",
                    mask.toString(16).toUpperCase()
                ].join(" "));
            }
        }
        
        if (typeof source == "string" && this.onRegRead) {
            this.onRegRead.call(this, {
                register: source,
                value: this[source]
            });
        }
        
        if (this.onRegWrite) {
            this.onRegWrite.call(this, {
                register: target,
                oldValue: oldValue,
                newValue: this[target]
            });
        }
    }
};

MarieSim.prototype.regAdd = function(target, source, subtract) {
    var oldValue = this[target];
    
    if (subtract) {
        this[target] -= typeof source == "string" ? this[source] : source;
        if (this.onRegLog) {
            this.onRegLog([
                target.toString().toUpperCase(),
                "←",
                target.toString().toUpperCase(),
                "-",
                source.toString(16).toUpperCase()
            ].join(" "));
        }
    }
    else {
        this[target] += typeof source == "string" ? this[source] : source;
        if (this.onRegLog) {
            this.onRegLog([
                target.toString().toUpperCase(),
                "←",
                target.toString().toUpperCase(),
                "+",
                source.toString(16).toUpperCase()
            ].join(" "));
        }
    }
    
    if (typeof source == "string" && this.onRegRead) {
        this.onRegRead.call(this, {
            register: source,
            value: this[source]
        });
    }
    
    if (this.onRegWrite) {
        this.onRegWrite.call(this, {
            register: target,
            oldValue: oldValue,
            newValue: this[target]
        });
    }
};

MarieSim.prototype.restart = function() {
    this.pc = this.origin;
    this.ac = 0x0000;
    this.ir = 0x0000;
    this.mar = 0x000;
    this.mbr = 0x0000;
    this.in = 0x0000;
    this.out = 0x0000;
    this.halted = false;
    this.stepper = null;
    this.paused = false;
    this.microStepper = null;
};

// This method blocks until machine execution completes.
MarieSim.prototype.run = function() {
    while (!this.halted) {
        for (let _ of this.fetch());
        this.decode();
        for (let _ of this.execute());
    }
};

MarieSim.prototype.step = function() {
    var microstep;
    while (!this.halted && microstep != "paused" && microstep != "step") {
        microstep = this.microStep();
    }
};

MarieSim.prototype.microStep = function() {
    var myself = this;
    
    if (!this.microStepper) {
        this.microStepper = (function*() {
            while (!myself.halted) {
                yield* myself.fetch();
                myself.decode();
                yield "step";
                yield* myself.execute();
            }
        }());
    }
    
    if (this.paused)
        return "paused";
     else
        return this.microStepper.next().value;
};

MarieSim.prototype.fetch = function*() {
    yield this.regSet("mar", "pc");
    yield this.regSet("ir", "m");
    yield this.regAdd("pc", 1);
};

MarieSim.prototype.decode = function() {
    var opcode = this.ir >> 12;
    
    for (var op in MarieSim.prototype.operators) {
        if (MarieSim.prototype.operators[op].opcode == opcode) {
            this.opcode = op;
            if (this.onRegLog) {
                this.onRegLog(["Decoded opcode", opcode.toString(16).toUpperCase(), "as", op].join(" "));
            }
            return;
        }
    }
    
    throw new MarieSimError("Illegal instruction", this.ir);
};

MarieSim.prototype.execute = function*() {
    yield* MarieSim.prototype.operators[this.opcode].fn.call(this);
};

MarieSim.prototype.operators = {
    add: {
        opcode: 0x3,
        operand: true,
        fn: function*() {
            yield this.regSet("mar", "ir", 0xFFF);
            yield this.regSet("mbr", "m");
            yield this.regAdd("ac", "mbr");
        }
    },
    subt: {
        opcode: 0x4,
        operand: true,
        fn: function*() {
            yield this.regSet("mar","ir", 0xFFF);
            yield this.regSet("mbr", "m");
            yield this.regAdd("ac", "mbr", true);
        }
    },
    addi: {
        opcode: 0xB,
        operand: true,
        fn: function*() {
            yield this.regSet("mar", "ir", 0xFFF);
            yield this.regSet("mbr", "m");
            yield this.regSet("mar", "mbr");
            yield this.regSet("mbr", "m");
            yield this.regAdd("ac", "mbr");
        }
    },
    clear: {
        opcode: 0xA,
        operand: false,
        fn: function*() {
            yield this.regSet("ac", 0);
        }
    },
    load: {
        opcode: 0x1,
        operand: true,
        fn: function*() {
            yield this.regSet("mar", "ir", 0xFFF);
            yield this.regSet("mbr", "m");
            yield this.regSet("ac", "mbr");
        }
    },
    loadi: {
        opcode: 0xD,
        operand: true,
        fn: function*() {
            yield this.regSet("mar", "ir", 0xFFF);
            yield this.regSet("mbr", "m");
            yield this.regSet("mar", "mbr");
            yield this.regSet("mbr", "m");
            yield this.regSet("ac", "mbr");
        }
    },
    store: {
        opcode: 0x2,
        operand: true,
        fn: function*() {
            yield this.regSet("mar", "ir", 0xFFF);
            yield this.regSet("mbr", "ac");
            yield this.regSet("m", "mbr");
        }
    },
    storei: {
        opcode: 0xE,
        operand: true,
        fn: function*() {
            yield this.regSet("mar", "ir", 0xFFF);
            yield this.regSet("mbr", "m");
            yield this.regSet("mar", "mbr");
            yield this.regSet("mbr", "ac");
            yield this.regSet("m", "mbr");
        }
    },
    input: {
        opcode: 0x5,
        operand: false,
        fn: function*() {
            yield this.regSet("in", this.inputCallback.call(null));
            yield this.regSet("ac", "in");
        }
    },
    output: {
        opcode: 0x6,
        operand: false,
        fn: function*() {
            yield this.regSet("out", "ac");
            yield this.outputCallback.call(null, this.out);
        }
    },
    jump: {
        opcode: 0x9,
        operand: true,
        fn: function*() {
            yield this.regSet("pc", "ir", 0xFFF);
        }
    },
    skipcond: {
        opcode: 0x8,
        operand: true,
        fn: function*() {
            switch (this.ir & 0xF00) {
                case 0x000:
                    if (this.onRegLog)
                        this.onRegLog("Is AC < 0?");
                    if (this.ac < 0)
                        this.regAdd("pc", 1);
                    break;
                case 0x400:
                    if (this.onRegLog)
                        this.onRegLog("Is AC = 0?");
                    if (this.ac == 0)
                        this.regAdd("pc", 1);
                    break;
                case 0x800:
                    if (this.onRegLog)
                        this.onRegLog("Is AC > 0?");
                    if (this.ac > 0)
                        this.regAdd("pc", 1);
                    break;
                default:
                    throw new MarieSimError("Undefined skipcond operand.", this.ir);
            }
            yield;
        }
    },
    jns: {
        opcode: 0x0,
        operand: true,
        fn: function*() {
            yield this.regSet("mbr", "pc");
            yield this.regSet("mar", "ir", 0xFFF);
            yield this.regSet("m", "mbr");
            yield this.regSet("mbr", "ir", 0xFFF);
            yield this.regSet("ac", 1);
            yield this.regAdd("ac", "mbr");
            yield this.regSet("pc", "ac");
        }
    },
    jumpi: {
        opcode: 0xC,
        operand: true,
        fn: function*() {
            yield this.regSet("mar", "ir", 0xFFF);
            yield this.regSet("mbr", "m");
            yield this.regSet("pc", "mbr");
        }
    },
    halt: {
        opcode: 0x7,
        operand: false,
        fn: function*() {
            this.halted = true;
            
            if(this.onRegLog) {
                this.onRegLog("----- halted -----");
                this.onRegLog("");
                this.onRegLog("");
            }
        }
    }
};

function MarieAsmError(name, lineNumber, message) {
    this.name = name || "MarieAsmError";
    this.message = message;
    this.stack = (new Error()).stack;
    
    this.lineNumber = lineNumber;
    this.toString = function() {
        return [name, " on line ", lineNumber, ". ", message].join("");
    };
}

MarieAsmError.prototype = Object.create(Error.prototype);
MarieAsmError.constructor = MarieAsmError;

function MarieAsm(assembly) {
    this.assembly = assembly;
}

MarieAsm.prototype.addressNumberFormatter = function(line) {
    var n = 3;

    var str = line.toString();
    // http://stackoverflow.com/a/10073788/824294
    // pads leading zeros if str is shorter than 3 characters.
    return str.length >= n ? str : new Array(n - str.length + 1).join("0") + str;
};

MarieAsm.prototype.assemble = function() {
    var parsed = [],
        origin = 0,
        lines = this.assembly.split("\n"),
        symbols = {};
    
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        
        if (/^\s*(?:\/.*)?$/.test(line))
            continue; // This line is empty, whitespace or a comment
        
        // Check for origination directive
        
        var originationDirective = line.match(/^\s*org\s+([0-9a-f]{3})\s*(?:\/.*)?$/i);
        
        if (originationDirective) {
            if (parsed.length != 0) {
                throw new MarieAsmError(
                    "Syntax error", 
                    (i + 1), 
                    "Unexpected origination directive."
                );
            }
            
            origin = parseInt(originationDirective[1], 16) ^ 0xFFF;
            
            continue;
        }
        
        // Try to match it with the correct syntax
        var matches = line.match(/^(?:([^,\/]+),)?\s*([^\s,]+?)(?:\s+([^\s,]+?))?\s*(?:\/.*)?$/);
        
        if (!matches) {
            // Syntax error
            throw new MarieAsmError(
                "Syntax error", 
                (i + 1), 
                "Incorrect form."
            );
        }
        
        var label = matches[1],
            operator = matches[2].toLowerCase(),
            operand = matches[3];
        
        // Record the symbol map
        if (label) {
            if (label.match(/^\d.*$/))
                throw new MarieAsmError(
                    "Syntax error", 
                    (i + 1), 
                    "Labels cannot start with a number."
                );
            symbols[label] = parsed.length + origin;
        }
        
        // Special END keyword
        if (operator == "end") {
            break;
        }
        
        parsed.push({
            label: label,
            operator: operator,
            operand: operand,
            line: (i + 1)
        });
    }
    
    for (var i = 0; i < parsed.length; i++) {
        var instruction = parsed[i];
        
        // Check for assembler directives
        var directiveBase = false;
        switch (instruction.operator) {
            case "dec":
                directiveBase = 10;
                break;
            case "oct":
                directiveBase = 8;
                break;
            case "hex":
                directiveBase = 16;
                break;
        }
        
        if (directiveBase) {
            if (instruction.operand == null) {
                throw new MarieAsmError(
                    "Syntax error",
                    instruction.line,
                    "Expected operand."
                );
            }
            var constant = parseInt(instruction.operand, directiveBase);
            if (isNaN(constant)) {
                throw new MarieAsmError(
                    "Syntax error", 
                    instruction.line, 
                    "Failed to parse operand."
                );
            }
            if (constant > 0xFFFF) {
                throw new MarieAsmError(
                    "Syntax error", 
                    instruction.line,
                    "Literal out of bounds."
                );
            }
            instruction.contents = constant;
            continue;
        }
        
        var operator = MarieSim.prototype.operators[instruction.operator],
            operand = instruction.operand;
        
        if (!operator) {
            throw new MarieAsmError(
                "Syntax error", 
                instruction.line, 
                ["Unknown operator ", instruction.operator, "."].join("")
            );
        }
        
        var needsOperand = operator.operand;
        if (needsOperand && !operand) {
            throw new MarieAsmError(
                "Syntax error", 
                instruction.line,
                "Expected operand."
            );
        }
        
        if (operand) {
            if (!needsOperand) {
                throw new MarieAsmError(
                    "Syntax error", 
                    instruction.line, 
                    ["Unexpected operand ", instruction.operand, "."].join("")
                );
            }
            
            if (operand.match(/^\d[0-9a-fA-F]*$/)) {
                // This is a literal address
                operand = parseInt(operand, 16);
                
                if (operand > 0x0FFF) {
                    throw new MarieAsmError(
                        "Syntax error", 
                        instruction.line, 
                        ["Address ", instruction.operand, " out of bounds."].join("")
                    );
                }
            }
            else {
                // This must be a label
                operand = symbols[operand];
                
                if (operand == null) {
                    throw new MarieAsmError(
                        "Syntax error", 
                        instruction.line, 
                        ["Unknown label ", instruction.operand, "."].join("")
                    );
                }
            }
        }
        
        instruction.contents = (operator.opcode << 12) | operand;
    }
        
    return {
        origin: origin,
        program: parsed,
        symbols: symbols
    };
};
