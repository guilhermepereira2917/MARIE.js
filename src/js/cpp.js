let CppConverter,
    CppConverterError;

(function() {
    CppConverter = function(tokens) {
        this.tokens = tokens;
    };

    CppConverter.prototype.convert = function() {
        this.current = 0;

        this.instructions = [];
        this.variables = [];

        console.log(this.tokens);

        while (!this.isAtEnd()) {
            this.statement();
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

        return [...this.instructions, ...this.variables].join("\n");
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
        else {
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

        this.variables.push(`${identifier.string}, DEC ${initialValue}`);
    };

    CppConverter.prototype.assignment = function() {
        const variable = this.consume("variable");
        const equals = this.consume("operator", "=");
        const leftVariable = this.consume("variable");
        const operator = this.consume("operator");
        const rightVariable = this.consume("variable");
        const semicolon = this.consume(null, ";");

        if (!["+", "-"].includes(operator.string)) {
            this.error(`Only "+" and "-" operations supported.`);
        }

        const operation = operator.string === "+" ? "Add" : "Subt";

        this.appendInstruction(`Load ${leftVariable.string}`);
        this.appendInstruction(`${operation} ${rightVariable.string}`);
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

    CppConverter.prototype.emptyLine = function() {
        this.appendInstruction("");
    }

    CppConverter.prototype.consume = function(tokenType, string) {
        const token = this.peek();

        if (this.isAtEnd() || token.type !== tokenType) {
            this.error(`Expected ${tokenType || "semicolon"}.`);
        }

        if (string && token.string !== string) {
            this.error(`Expected ${tokenType || "semicolon"} to be equals to "${string}"`)
        }

        this.advance();

        return token;
    };

    CppConverter.prototype.error = function(message) {
        const errorToken = this.peek() || this.peekPrevious();
        throw new CppConverterError(message, errorToken.line);
    };

    CppConverter.prototype.appendInstruction = function(instruction) {
        this.instructions.push(instruction);
    };

    CppConverter.prototype.advance = function() {
        if (!this.isAtEnd()) {
            this.current++;
        }
    };

    CppConverter.prototype.match = function(tokenType, string) {
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