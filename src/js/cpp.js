let CppConverter,
    CppConverterError;

(function() {
    CppConverter = function(tokens) {
        this.tokens = tokens;
    };

    CppConverter.prototype.convert = function() {
        this.current = 0;
        this.ifCounter = 0;
        this.nextLabelForIfExit = null;
        this.currentConsumedTokens = [];

        this.instructions = [];
        this.variables = [];
        this.subroutines = [];
        this.constants = [];

        this.usesMultiplicationSubroutine = false;

        console.log(this.tokens);

        while (!this.isAtEnd()) {
            this.statement();
        }

        if (this.usesMultiplicationSubroutine) {
            this.addMultiplicationSubroutine();
        }

        if (this.haveInstructions() && !this.isLastInstructionEmptyLine()) {
            this.appendInstruction("");
        }

        if (this.haveInstructions() || this.haveVariables()) {
            this.appendInstruction("Halt");
        }

        if (this.haveVariables() && !this.isLastInstructionEmptyLine()) {
           this.appendInstruction("");
        }

        return [...this.instructions, ...this.variables, ...this.subroutines, ...this.constants].join("\n");
    };

    CppConverter.prototype.statement = function() {
        if (this.isEmptyLine() && this.haveInstructions() && !this.isLastInstructionEmptyLine()) {
            this.emptyLine();
        }

        if (this.match("type")) {
            this.varDeclaration();
        }
        else if (this.match("variable")) {
            this.assignment();
        }
        else if (this.match("keyword", "cout")) {
            this.cout();
        }
        else if (this.match("keyword", "cin")) {
            this.cin();
        }
        else if (this.match("keyword", "if")) {
            this.if();
        }
        else if (!this.isAtEnd()) {
            this.error("Unidentified expression.");
        }
    };

    CppConverter.prototype.varDeclaration = function() {
        const type = this.consume("type", "int");
        const identifier = this.consume("variable");

        let initialValue;

        if (this.match(null, ";")) {
            initialValue = 0;
            const semicolon = this.consume(null, ";");
        } else {
            const equals = this.consume("operator", "=");
            initialValue = this.consume("number").string;
            const semicolon = this.consume(null, ";");
        }

        this.appendVariable(`${identifier.string}, DEC ${initialValue} / ${this.getFormattedCurrentConsumedTokens()}`);
    };

    CppConverter.prototype.assignment = function() {
        const variable = this.consume("variable");
        const equals = this.consume("operator", "=");
        const leftVariable = this.consume("variable");
        const operator = this.consume("operator");
        const rightVariable = this.consume("variable");
        const semicolon = this.consume(null, ";");

        if (!["+", "-", "*"].includes(operator.string)) {
            this.error(`Only "+", "-" and "*" operations supported.`);
        }

        if (["+", "-"].includes(operator.string)) {
            const operation = operator.string === "+" ? "Add" : "Subt";

            this.appendInstruction(`Load ${leftVariable.string}`);
            this.appendInstruction(`${operation} ${rightVariable.string}`);
        } else {
            this.usesMultiplicationSubroutine = true;

            this.appendInstruction(`Load ${leftVariable.string}`);
            this.appendInstruction(`Store MultA`);
            this.appendInstruction(`Load ${rightVariable.string}`);
            this.appendInstruction(`Store MultB`);
            this.appendInstruction(`JnS MultReturn`);
            this.appendInstruction(`Load MultResult`);
        }

        this.appendInstruction(`Store ${variable.string}`);
    };

    CppConverter.prototype.cout = function() {
        const cout = this.consume("keyword", "cout");
        const operator = this.consume("operator", "<<");
        const variable = this.consume("variable");
        const semicolon = this.consume(null, ";");

        this.appendInstruction(`Load ${variable.string}`);
        this.appendInstruction(`Output`);
    };

    CppConverter.prototype.cin = function() {
        const cin = this.consume("keyword", "cin");
        const operator = this.consume("operator", ">>");
        const variable = this.consume("variable");
        const semicolon = this.consume(null, ";");

        this.appendInstruction(`Input`);
        this.appendInstruction(`Store ${variable.string}`);
    };

    CppConverter.prototype.if = function() {
        const ifStatement = this.consume("keyword", "if");
        const leftParen = this.consume(null, "(");
        const leftVariable = this.consume("variable");
        const operator = this.consume("operator")
        const rightVariable = this.consume("variable");
        const rightParen = this.consume(null, ")");
        const openBrackets = this.consume(null, "{");

        if (!["==", ">", "<"].includes(operator.string)) {
            this.error(`Only "==", ">" and "<" operations supported in if statements.`);
        }

        const skipcondOpcode = function() {
            switch (operator.string) {
                case "<": return "000";
                case "==": return "400";
                case ">": return "800";
            }
        }();

        const ifExitLabel = `EndIf${++this.ifCounter}`;

        this.appendInstruction(`Load ${leftVariable.string}`);
        this.appendInstruction(`Subt ${rightVariable.string}`);
        this.appendInstruction(`Skipcond ${skipcondOpcode}`);
        this.appendInstruction(`Jump ${ifExitLabel}`);

        while (!this.isAtEnd() && !this.match(null, "}")) {
            this.statement();
        }

        this.nextLabelForIfExit = ifExitLabel;

        const closeBrackets = this.consume(null, "}")
    }

    CppConverter.prototype.addMultiplicationSubroutine = function() {
        this.appendSubroutine("");
        this.appendSubroutine("/ Multiplication SubRoutine");
        this.appendSubroutine("MultReturn, DEC 0");
        this.appendSubroutine("            Clear");
        this.appendSubroutine("            Store MultResult");
        this.appendSubroutine("");
        this.appendSubroutine("            Load MultB");
        this.appendSubroutine("            Skipcond 400");
        this.appendSubroutine("            Jump Mult");
        this.appendSubroutine("            JumpI MultReturn");
        this.appendSubroutine("");
        this.appendSubroutine("Mult,    Load MultResult");
        this.appendSubroutine("         Add MultA");
        this.appendSubroutine("         Store MultResult");
        this.appendSubroutine("");
        this.appendSubroutine("         Load MultB");
        this.appendSubroutine("         Subt One");
        this.appendSubroutine("         Store MultB");
        this.appendSubroutine("");
        this.appendSubroutine("         Skipcond 400");
        this.appendSubroutine("         Jump Mult");
        this.appendSubroutine("");
        this.appendSubroutine("         JumpI MultReturn");
        this.appendSubroutine("");
        this.appendSubroutine("MultA, DEC 0");
        this.appendSubroutine("MultB, DEC 0");
        this.appendSubroutine("");
        this.appendSubroutine("MultResult, DEC 0");
        this.appendSubroutine("");

        this.appendConstant("/ Constants");
        this.appendConstant("One, DEC 1");
    };

    CppConverter.prototype.emptyLine = function() {
        this.appendInstruction("");
    };

    CppConverter.prototype.consume = function(tokenType, string) {
        this.advanceUselessTokens();

        const token = this.peek();

        if (this.isAtEnd() || token.type !== tokenType) {
            this.error(`Expected ${tokenType || string}.`);
        }

        if (string && token.string !== string) {
            this.error(`Expected ${tokenType || "token"} to be equals to "${string}"`)
        }

        this.advance();

        return token;
    };

    CppConverter.prototype.error = function(message) {
        const errorToken = this.peek() || this.peekPrevious();
        throw new CppConverterError(message, errorToken.line);
    };

    CppConverter.prototype.advanceUselessTokens = function() {
        while (!this.isAtEnd() && (this.peek().type === "comment" || this.peek().string.trim() === "")) {
            this.advance();
        }
    }

    CppConverter.prototype.appendVariable = function(variable) {
        this.variables.push(variable);
    };

    CppConverter.prototype.appendInstruction = function(instruction) {
        const currentConsumedTokensFormatted = this.getFormattedCurrentConsumedTokens();
        if (currentConsumedTokensFormatted) {
            this.instructions.push(`/ ${currentConsumedTokensFormatted}`);
        }

        if (this.nextLabelForIfExit != null && instruction !== "") {
            instruction = `${this.nextLabelForIfExit}, ${instruction}`;
            this.nextLabelForIfExit = null;
        }

        this.instructions.push(instruction);
    };

    CppConverter.prototype.appendConstant = function(constant) {
        this.constants.push(constant);
    }

    CppConverter.prototype.appendSubroutine = function(subroutine) {
        this.subroutines.push(subroutine);
    };

    CppConverter.prototype.advance = function() {
        if (this.peek() && this.peek().type !== "comment") {
            this.currentConsumedTokens.push(this.peek());
        }

        if (!this.isAtEnd()) {
            this.current++;
        }
    };

    CppConverter.prototype.match = function(tokenType, string) {
        this.advanceUselessTokens();

        if (this.isAtEnd()) {
            return false;
        }

        return this.peek().type === tokenType && (!string || this.peek().string === string);
    };

    CppConverter.prototype.isEmptyLine = function() {
        const currentLineNumber = this.peek().line;

        if (this.peekPrevious() && currentLineNumber - this.peekPrevious().line > 1) {
            return true;
        }

        return this.peekNext() && this.peekNext().line - currentLineNumber > 1;
    }

    CppConverter.prototype.getFormattedCurrentConsumedTokens = function() {
        const formattedTokens = this.currentConsumedTokens.map(token => token.string).join("").trim();
        this.currentConsumedTokens = [];

        return formattedTokens;
    }

    CppConverter.prototype.peekPrevious = function() {
        return this.tokens[this.current - 1];
    };

    CppConverter.prototype.peek = function() {
        return this.tokens[this.current];
    };

    CppConverter.prototype.peekNext = function() {
        return this.tokens[this.current + 1];
    };

    CppConverter.prototype.isAtEnd = function() {
        return this.current >= this.tokens.length;
    };

    CppConverter.prototype.haveInstructions = function() {
        return this.instructions.length !== 0;
    };

    CppConverter.prototype.haveVariables = function() {
        return this.variables.length !== 0;
    };

    CppConverter.prototype.isLastInstructionEmptyLine = function() {
        if (this.getLastInstruction() === undefined) {
            return false;
        }

        return this.getLastInstruction().length === 0;
    };

    CppConverter.prototype.getLastInstruction = function() {
        if (!this.haveInstructions()) {
            return undefined;
        }

        return this.instructions[this.instructions.length - 1];
    }

    CppConverterError = function(message, line) {
        this.message = message;
        this.line = line;

        this.toString = function() {
            return ["L", this.line, " - ", this.message].join("")
        }
    };

}());