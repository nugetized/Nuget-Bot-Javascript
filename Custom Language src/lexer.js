function is_numeric_char(c) {
    if (!c) return false
    return /\d/.test(c)
}

function is_alpha_char(c) {
    if (!c) return false
    return /[a-zA-Z_]/.test(c)
}

function is_alpha_numeric_char(c) {
    if (!c) return false
    return /[a-zA-Z0-9_]/.test(c)
}

function is_whitespace(c) {
    if (!c) return false
    return /\s/.test(c)
}

class Token {
    constructor(type, value) {
        this.type = type
        this.value = value
    }
}

const TokenType = {
    INT: "INT",
    STR: "STR",
    BOOL: "BOOL",
    NULL: "NULL",
    UNDEF: "UNDEF",

    POW: "POW", SQRT: "SQRT",
    MUL: "MUL", DIV: "DIV",
    PLUS: "PLUS", MINUS: "MINUS",

    LPAREN: "(", RPAREN: ")",
    SEMI: "SEMI", ASSIGN: "ASSIGN",

    EQUALS: "EQUALS", NOT_EQUALS: "NOT_EQUALS",
    MORE_THAN: "MORE_THAN", LESS_THAN: "LESS_THAN",

    ID: "ID", DOT: "DOT", COMMA: "COMMA",

    LET: "LET",
    CONST: "CONST",
    // PRINT: "PRINT",
    IF: "IF", FOR: "FOR", WHILE: "WHILE", 
    ELSE: "ELSE", OR: "OR", AND: "AND", FN: "FN", RETURN: "RETURN",

    LBRACE: "{", RBRACE: "}",

    EOF: "EOF",
}

const Keywords = {
    "let": new Token(TokenType.LET, "let"),
    "const": new Token(TokenType.CONST, "const"),

    "function": new Token(TokenType.FN, "function"),
    "if": new Token(TokenType.IF, "if"),
    "while": new Token(TokenType.WHILE, "while"),
    "for": new Token(TokenType.FOR, "for"),
    "or": new Token(TokenType.OR, "or"),
    "and": new Token(TokenType.AND, "and"),
    "else": new Token(TokenType.ELSE, "else"),
    "return": new Token(TokenType.RETURN, "return"),

    // "print": new Token(TokenType.PRINT, "print"),

    "true": new Token(TokenType.BOOL, "true"),
    "false": new Token(TokenType.BOOL, "false"),

    "null": new Token(TokenType.NULL, "null"),
    "undefined": new Token(TokenType.UNDEF, "undefined")

}

class Lexer {
    constructor(text) {
        this.text = text
        this.pos = 0
        this.currentChar = this.text[this.pos] ?? null
    }

    error() {
        throw new Error("Error parsing input")
    }

    advance() {
        this.pos++

        if (this.pos > this.text.length - 1) {
            this.currentChar = null
        } else {
            this.currentChar = this.text[this.pos]
        }
    }

    skipWhitespace() {
        while (
            this.currentChar !== null &&
            is_whitespace(this.currentChar)
        ) {
            this.advance()
        }
    }

    integer() {
        let result = ""

        while (
            this.currentChar !== null &&
            (
                is_numeric_char(this.currentChar) ||
                this.currentChar === "."
            )
        ) {
            result += this.currentChar
            this.advance()
        }

        if (result.startsWith(".")) {
            result = `0${result}`
        }

        return parseFloat(result)
    }

    string() {
        const quoteChar = this.currentChar
        this.advance()

        let result = ""

        while (
            this.currentChar !== null &&
            this.currentChar !== quoteChar
        ) {
            result += this.currentChar
            this.advance()
        }

        if (this.currentChar === quoteChar) {
            this.advance()
        } else {
            throw new Error(
                "Invalid Syntax, did you forget 'closing quote'?"
            )
        }

        return result
    }

    _id() {
        let result = ""

        while (
            this.currentChar !== null &&
            is_alpha_numeric_char(this.currentChar)
        ) {
            result += this.currentChar
            this.advance()
        }

        return Keywords[result] ?? new Token(TokenType.ID, result)
    }

    peek() {
        let peek_pos = this.pos + 1

        if (peek_pos > this.text.length - 1) {
            return ""
        }

        return this.text[peek_pos]
    }

    getNextToken() {
        while (this.currentChar !== null) {

            if (is_whitespace(this.currentChar)) {
                this.skipWhitespace()
                continue
            }

            if (
                is_numeric_char(this.currentChar) ||
                (
                    this.currentChar === "." &&
                    is_numeric_char(this.peek())
                )
            ) {
                return new Token(
                    TokenType.INT,
                    this.integer()
                )
            }

            if (is_alpha_char(this.currentChar)) {
                return this._id()
            }

            if (this.currentChar === "^" && this.peek() === "!") {
                this.advance()
                this.advance()

                return new Token(TokenType.POW, "^!")
            }

            else if (this.currentChar === "=" && this.peek() === "=") {
                this.advance()
                this.advance()

                return new Token(TokenType.EQUALS, "==")
            }

            else if (this.currentChar === "!" && this.peek() === "=") {
                this.advance()
                this.advance()

                return new Token(TokenType.NOT_EQUALS, "!=")
            }

            else if (this.currentChar === ">") {
                this.advance()
                return new Token(TokenType.MORE_THAN, ">")
            }

            else if (this.currentChar === "<") {
                this.advance()
                return new Token(TokenType.LESS_THAN, "<")
            }

            else if (
                this.currentChar === "'" ||
                this.currentChar === '"'
            ) {
                return new Token(
                    TokenType.STR,
                    this.string()
                )
            }

            switch (this.currentChar) {
                case "+":
                    this.advance()
                    return new Token(TokenType.PLUS, "+")

                case "-":
                    this.advance()
                    return new Token(TokenType.MINUS, "-")

                case "*":
                    this.advance()
                    return new Token(TokenType.MUL, "*")

                case "/":
                    this.advance()
                    return new Token(TokenType.DIV, "/")

                case "(":
                    this.advance()
                    return new Token(TokenType.LPAREN, "(")

                case ")":
                    this.advance()
                    return new Token(TokenType.RPAREN, ")")

                case "{":
                    this.advance()
                    return new Token(TokenType.LBRACE, "{")

                case "}":
                    this.advance()
                    return new Token(TokenType.RBRACE, "}")

                case ";":
                    this.advance()
                    return new Token(TokenType.SEMI, ";")

                case "=":
                    this.advance()
                    return new Token(TokenType.ASSIGN, "=")

                case ".":
                    this.advance()
                    return new Token(TokenType.DOT, ".")

                case ",":
                    this.advance()
                    return new Token(TokenType.COMMA, ",")
            }

            throw new Error(
                "Invalid Syntax, character not recognized"
            )
        }

        return new Token(TokenType.EOF, null)
    }
}

module.exports = {
    Lexer,
    Token,
    TokenType
}