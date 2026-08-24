const { TokenType, Token } = require("./lexer")

const {
    BinOp,
    UnaryOp,
    Num,
    Str,
    Bool,
    Var,
    Call
} = require("./ast/expressions")

const {
    Compound,
    Assign,
    VarDecl,
    ConstDecl,
    Print,
    If,
    While,
    NoOp,
    For,
    FunctionDecl
} = require("./ast/statements")

class Parser {
    constructor(lexer) {
        this.lexer = lexer
        this.currentToken = this.lexer.getNextToken()
    }

    error() {
        throw new Error('Invalid syntax, reason not given')
    }

    eat(tokenType) {
        if (this.currentToken.type !== tokenType) { 
            if (tokenType == TokenType.SEMI) {
                throw new Error("Invalid syntax, did you forget ';'?")
            } else {
                throw new Error("Invalid syntax, " + tokenType + " expected, got " + this.currentToken.type)
            }
        }

        this.currentToken = this.lexer.getNextToken()
    }

    program() {
        return this.compound_statement()
    }

    statement_list() {
        let results = []

        while (this.currentToken.type !== TokenType.EOF && this.currentToken.type !== TokenType.RBRACE) {
            let stmt = this.statement()
            if (stmt instanceof NoOp) {
                if (this.currentToken.type === TokenType.SEMI) {
                    this.eat(TokenType.SEMI)
                    continue
                }
                break
            }
            results.push(stmt)
        }

        return results
    }

    statement() {
        let node

        switch (this.currentToken.type) {
            case TokenType.LET:
                node = this.declaration_statement()
                this.eat(TokenType.SEMI)
                return node
            case TokenType.CONST:
                node = this.const_statement()
                this.eat(TokenType.SEMI)
                return node
            // case TokenType.PRINT:
            //     node = this.print_statement()
            //     this.eat(TokenType.SEMI)
            //     return node
            case TokenType.IF:
                return this.if_statement()
            case TokenType.WHILE:
                return this.while_statement()
            case TokenType.FOR:
                return this.for_statement()
            case TokenType.ID:
                let varNode = this.variable()
                if (this.currentToken.type === TokenType.ASSIGN) {
                    let token = this.currentToken
                    this.eat(TokenType.ASSIGN)
                    let right = this.or_expr()
                    node = new Assign(varNode, token, right)
                } else if (this.currentToken.type === TokenType.LPAREN) {
                    node = varNode
                    while (this.currentToken.type === TokenType.LPAREN) {
                        node = this.finishCall(node)
                    } 
                } else {
                        node = varNode
                }
                this.eat(TokenType.SEMI)
                return node
            case TokenType.FN:
                return this.function_declaration()
            default:
                return this.empty()
        }
    }

    function_declaration() {
        this.eat(TokenType.FN)
        let fnName = this.variable()

        this.eat(TokenType.LPAREN)
        let params = []
        if (this.currentToken.type !== TokenType.RPAREN) {
            params.push(this.variable())
            while (this.currentToken.type === TokenType.COMMA) {
                this.eat(TokenType.COMMA)
                params.push(this.variable())
            }
        }

        this.eat(TokenType.RPAREN)

        let body = this.block_statement()
        return new FunctionDecl(fnName, params, body)
    }

    declaration_statement() {
        this.eat(TokenType.LET)
        let variableName = this.variable()
        
        let variableValue = null
        if (this.currentToken.type === TokenType.ASSIGN) {
            this.eat(TokenType.ASSIGN)
            variableValue = this.or_expr()
        }

        return new VarDecl(variableName, variableValue) 
    }

    const_statement() {
        this.eat(TokenType.CONST)
        let variableName = this.variable()
        
        let variableValue = null
        if (this.currentToken.type === TokenType.ASSIGN) {
            this.eat(TokenType.ASSIGN)
            variableValue = this.or_expr()
        }

        return new ConstDecl(variableName, variableValue) 
    }

    block_statement() {
        this.eat(TokenType.LBRACE)
        let node = this.compound_statement()
        this.eat(TokenType.RBRACE)
        return node
    }

    if_statement() {
        this.eat(TokenType.IF)
        this.eat(TokenType.LPAREN)
        let condition = this.or_expr()
        this.eat(TokenType.RPAREN)

        let thenBranch = this.currentToken.type === TokenType.LBRACE
            ? this.block_statement()
            : this.statement()

        let elseBranch = null
        if (this.currentToken.type === TokenType.ELSE) {
            this.eat(TokenType.ELSE)
            elseBranch = this.currentToken.type === TokenType.LBRACE
                ? this.block_statement()
                : this.statement()
        }

        return new If(condition, thenBranch, elseBranch)
    }

    while_statement() {
        this.eat(TokenType.WHILE)
        this.eat(TokenType.LPAREN)
        let condition = this.or_expr()
        this.eat(TokenType.RPAREN)

        let body = this.currentToken.type === TokenType.LBRACE
            ? this.block_statement()
            : this.statement()

        return new While(condition, body)
    }

    for_statement() {
        this.eat(TokenType.FOR)
        this.eat(TokenType.LPAREN)

        this.eat(TokenType.LET)

        let varNode = this.variable()
        this.eat(TokenType.ASSIGN)

        let start = this.or_expr()
        this.eat(TokenType.COMMA)

        let limit = this.or_expr()

        let step = null
        if (this.currentToken.type === TokenType.COMMA) {
            this.eat(TokenType.COMMA)
            step = this.or_expr()
        } else {
            step = new Num({type: TokenType.INT, value: 1})
        }

        this.eat(TokenType.RPAREN)

        let body = this.currentToken.type === TokenType.LBRACE
            ? this.block_statement()
            : this.statement()

        return new For(varNode, start, limit, step, body)
    }

    assignment_statement() {
        let left = this.variable()
        let token = this.currentToken
        this.eat(TokenType.ASSIGN)
        let right = this.or_expr()

        return new Assign(left, token, right)
    }

    print_statement() {
        this.eat(TokenType.PRINT)
        this.eat(TokenType.LPAREN)
        let exprNode = this.or_expr()
        this.eat(TokenType.RPAREN)

        return new Print(exprNode)
    }

    compound_statement() {
        let nodes = this.statement_list()
        let root = new Compound()
        root.children = nodes
        return root
    }

    variable() {
        let node = new Var(this.currentToken)
        this.eat(TokenType.ID)
        return node
    }

    empty() {
        return new NoOp()
    }

    factor() {
        let node = this.primary()

        while (this.currentToken.type === TokenType.LPAREN) {
            node = this.finishCall(node)
        }

        return node
    }

    primary() {
       let token = this.currentToken

        switch (token.type) {
            case TokenType.PLUS:
                this.eat(TokenType.PLUS)
                return new UnaryOp(token, this.factor())
            case TokenType.MINUS:
                this.eat(TokenType.MINUS)
                return new UnaryOp(token, this.factor())
            case TokenType.INT:
                this.eat(TokenType.INT)
                return new Num(token)
            case TokenType.STR:
                this.eat(TokenType.STR)
                return new Str(token)
            case TokenType.LPAREN:
                this.eat(TokenType.LPAREN)
                let node = this.or_expr()
                this.eat(TokenType.RPAREN)
                return node
            case TokenType.ID:
                return this.variable()
            case TokenType.BOOL:
                let isTrue = token.value === "true"
                this.eat(TokenType.BOOL)
                return new Bool(new Token(TokenType.BOOL, isTrue))
            default:
                throw new Error("Invalid Syntax, given token type not found")
        }
    }

    finishCall(callee) {
        this.eat(TokenType.LPAREN)
        let args = []

        if (this.currentToken.type !== TokenType.RPAREN) {
            args.push(this.or_expr())
            while (this.currentToken.type === TokenType.COMMA) {
                this.eat(TokenType.COMMA)
                args.push(this.or_expr())
            }
        }

        this.eat(TokenType.RPAREN)
        return new Call(callee, args)
    }

    pow() {
        let node = this.factor()

        while ([TokenType.POW, TokenType.SQRT].includes(this.currentToken.type)) {
            let token = this.currentToken
            if (token.type === TokenType.SQRT) {
                this.eat(TokenType.SQRT)
            } else if (token.type === TokenType.POW) {
                this.eat(TokenType.POW)
            }

            node = new BinOp(node, token, this.factor())
        }

        return node
    }

    term() {
        let node = this.pow()

        while ([TokenType.MUL, TokenType.DIV].includes(this.currentToken.type)) {
            let token = this.currentToken
            if (token.type === TokenType.MUL) {
                this.eat(TokenType.MUL)
            } else if (token.type === TokenType.DIV) {
                this.eat(TokenType.DIV)
            }

            node = new BinOp(node, token, this.pow())
        }

        return node
    }

    expr() {
        let node = this.term()

        while ([TokenType.PLUS, TokenType.MINUS].includes(this.currentToken.type)) {
            let token = this.currentToken
            this.eat(token.type)
            node = new BinOp(node, token, this.term())
        }

        return node
    }

    relational_expr() {
        let node = this.expr()

        while ([TokenType.LESS_THAN, TokenType.MORE_THAN].includes(this.currentToken.type)) {
            let token = this.currentToken
            this.eat(token.type)
            node = new BinOp(node, token, this.expr())
        }

        return node
    }

    equality_expr() {
        let node = this.relational_expr()

        while ([TokenType.EQUALS, TokenType.NOT_EQUALS].includes(this.currentToken.type)) {
            let token = this.currentToken
            this.eat(token.type)
            node = new BinOp(node, token, this.relational_expr())
        }

        return node
    }

    and_expr() {
        let node = this.equality_expr()

        while (this.currentToken.type === TokenType.AND) {
            let token = this.currentToken
            this.eat(TokenType.AND)

            node = new BinOp(node, token, this.equality_expr())
        }

        return node
    }

    or_expr() {
        let node = this.and_expr()

        while (this.currentToken.type === TokenType.OR) {
            let token = this.currentToken
            this.eat(TokenType.OR)

            node = new BinOp(node, token, this.and_expr())
        }

        return node
    }

    parse() {
        let node = this.program()

        if (this.currentToken.type !== TokenType.EOF) {
            throw new Error("Invalid Syntax, EOF Expected, got " + this.currentToken.type)
        }

        return node
    }
}

module.exports = {Parser}