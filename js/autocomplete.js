function getCompletions(editor, options) {
    var cursor = editor.getCursor();
    var line = editor.getLine(cursor.line)
    
    var end = cursor.ch;
    var start = end;
    
    while (line.charAt(start - 1).match(/[^,\s]/)) {
        start--;
    }
    
    if (start == end) {
        return;
    }
    
    var from = CodeMirror.Pos(cursor.line, start);
    var to = CodeMirror.Pos(cursor.line, end);
    
    var list = [];
    
    var state = editor.getTokenAt(from).state.state;
    
    var completions = {
        operators: ["Add", "Subt", "Addi", "Load", "Loadi", "Store", "Storei", "Jump", "Skipcond", "Jns", "Jumpi", "Clear", "Input", "Output", "Halt"],
        origination: ["ORG"],
        operand: ["DEC", "OCT", "HEX"]
    };
    
    switch (state) {
        case ("start"):
            Array.prototype.push.apply(list, completions.origination.map(function(x) {
                return {
                    text: x,
                    className: "completion-origination"
                };
            }));
        case ("operator"):
            Array.prototype.push.apply(list, completions.operators.map(function(x) {
                return {
                    text: x,
                    className: "completion-operator"
                }
            }));
        case ("operand"):
            Array.prototype.push.apply(list, completions.operand.map(function(x) {
                return {
                    text: x,
                    className: "completion-operand"
                }
            }));
    }
    
    if (state == "operand") {
        // Also find labels for completion
        for (var i = 0; i < editor.lineCount(); i++) {
            var label = editor.getLine(i).match(/^(?:([^,\/]+),)/)
            if (label) {
                list.push({
                    text: label[1],
                    className: "completion-label"
                });
            }
        }
    }
    
    list = list.filter(function(completion) {
        var x = completion.text.toLowerCase();
        var y = line.substring(start, end).toLowerCase();
        return x != y && x.indexOf(y) == 0;
    });
    
    return {
        list: list,
        from: from,
        to: to
    }
}