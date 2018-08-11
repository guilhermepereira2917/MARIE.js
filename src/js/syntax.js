CodeMirror.defineSimpleMode("marie", {
    start: [
        {regex: /[^\d,\/\s][^,\/\s]*,/, token: "string", next: "operator"}, // Labels
        {regex: /(?:add|subt|addi|load|loadi|store|storei|jump|skipcond|jns|jumpi|adr)\b/i, token: "keyword", next: "operand"}, // Operator
        {regex: /(?:clear|input|output|halt)\b/i, token: "keyword", next: "start"}, // Operator
        {regex: /(?:org|dec|oct|hex)\b/i, token: "atom", next: "literal"},
        {regex: /\/.*/, token: "comment"}, // Comments
        {regex: /end\b/i, token: "comment", next: "end"},
    ],
    operator: [
        {regex: /(?:add|subt|addi|load|loadi|store|storei|jump|skipcond|jns|jumpi|adr)\b/i, token: "keyword", next: "operand"}, // Operator
        {regex: /(?:clear|input|output|halt)\b/i, token: "keyword", next: "start"}, // Operator
        {regex: /(?:org|dec|oct|hex)\b/i, token: "atom", next: "literal"}, // Literal
    ],
    operand: [
        {regex: /(?:org|dec|oct|hex)\b/i, token: "atom", next: "literal"}, // Literal
        {regex: /\d[0-9a-f]*\b/i, token: "variable-3", next: "start"}, // Address
        {regex: /[0-9a-z]+\b/i, token: "variable-2", next: "start"}, // Reference
    ],
    literal: [
        {regex: /[0-9a-f]+/i, token: "number", next: "start"} // Number
    ],
    end: [
        {regex: /.*/, token: "comment"}
    ],
    meta: {
        lineComment: "/"
    }
});