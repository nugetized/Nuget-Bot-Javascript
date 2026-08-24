const { AST } = require("./expressions")

class Compound extends AST {
    constructor() {
        super()
        this.children = []
    }
}

class Assign extends AST {
    constructor(left, op, right) {
        super()
        this.left = left
        this.token = this.op = op
        this.right = right
    }
}

class VarDecl extends AST {
    constructor(varNode, exprNode) {
        super()
        this.varNode = varNode
        this.exprNode = exprNode
    }
}

class ConstDecl extends AST {
    constructor(varNode, exprNode) {
        super()
        this.varNode = varNode
        this.exprNode = exprNode
    }
}

class Print extends AST {
    constructor(expr) {
        super()
        this.expr = expr
    }
}

class If extends AST {
    constructor(condition, thenBranch, elseBranch = null) {
        super()
        this.condition = condition
        this.thenBranch = thenBranch
        this.elseBranch = elseBranch
    }
}

class While extends AST {
    constructor(condition, body) {
        super()
        this.condition = condition
        this.body = body
    }
}

class For extends AST {
    constructor(variable, start, limit, step, body) {
        super()
        this.variable = variable
        this.start = start
        this.limit = limit
        this.step = step
        this.body = body
    }
}

class FunctionDecl extends AST {
    constructor(name, params, body) {
        super()
        this.fnName = name
        this.params = params
        this.body = body
    }
}

class Return extends AST {
    constructor(expr = null) {
        super()
        this.expr = expr
    }
}

class NoOp extends AST {}

module.exports = {
    Compound,
    Assign,
    VarDecl,
    ConstDecl,
    Print,
    If,
    While,
    NoOp,
    For,
    FunctionDecl,
    Return
};