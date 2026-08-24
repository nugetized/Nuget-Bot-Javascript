class AST {}

class BinOp extends AST {
    constructor(left, op, right) {
        super()
        this.left = left
        this.token = this.op = op
        this.right = right
    }
}

class UnaryOp extends AST {
    constructor(op, expr) {
        super()
        this.token = this.op = op
        this.expr = expr
    }
}

class Num extends AST {
    constructor(token) {
        super()
        this.token = token
        this.value = token.value
    }
}

class Str extends AST {
    constructor(token) {
        super()
        this.token = token
        this.value = token.value
    }
}

class Bool extends AST {
    constructor(token) {
        super()
        this.token = token
        this.value = token.value
    }
}

class Null extends AST {
    constructor(token, value) {
        super()
        this.token = token
        this.value = value
    }
}

class UnDef extends AST {
    constructor(token, value) {
        super()
        this.token = token
        this.value = value
    }
}

class Var extends AST {
    constructor(token) {
        super()
        this.token = token
        this.value = token.value
    }
}

class Call extends AST {
    constructor(callee, args) {
        super()
        this.callee = callee
        this.args = args
    }
}

module.exports = {
    AST,
    BinOp,
    UnaryOp,
    Num,
    Str,
    Bool,
    Var,
    Call,
    Null,
    UnDef,
};