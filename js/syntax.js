CodeMirror.defineSimpleMode("marie", {
    start: [
        {regex: /[^\d,\/\s][^,\/\s]*,/, token: "string"},
        {regex: /(?:add|subt|addi|clear|load|loadi|store|storei|input|output|jump|skipcond|jns|jumpi|halt)\b/i, token: "keyword"},
        {regex: /(?:org|dec|oct|hex)\b/i, token: "atom", next: "literal"},
        {regex: /\d[0-9a-f]*\b/i, token: "variable-3", next: "start"},
        {regex: /[0-9a-z]+\b/i, token: "variable-2", next: "start"},
        {regex: /\/.*/, token: "comment"},
    ],
    literal: [
        {regex: /[0-9a-f]+/i, token: "number", next: "start"}
    ],
    meta: {
        lineComment: "/"
    }
});