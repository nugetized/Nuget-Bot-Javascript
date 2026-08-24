const { TokenType } = require("./lexer.js")
const { Parser } = require("./parser")

class NodeVisitor {
    visit(node) {
        if (!node) return null
        let methodName = "visit_" + node.constructor.name
        let visitor = this[methodName] ?? this.genericVisit
        return visitor.call(this, node)
    }

    genericVisit(node) {
        throw new Error(`No visit_${node.constructor.name} method`)
    }
}

class Enviroment {
    constructor(parent = null) {
        this.parent = parent
        this.values = new Map()
        this.declaredVars = new Set()
        this.constVars = new Set()
    }

    define(name, value, isConst = false) {
        if (this.declaredVars.has(name)) {
            throw new Error(`Identifier '${name}' has already been declared`)
        }
        this.declaredVars.add(name)
        if (isConst) this.constVars.add(name)
        this.values.set(name, value)
    }

    get(name) {
        if (this.declaredVars.has(name)) {
            return this.values.get(name)
        }
        if (this.parent !== null) {
            return this.parent.get(name)
        }
        throw new Error(`Variable '${name}' is not declared or defined`)
    }

    assign(name, value) {
        if (this.declaredVars.has(name)) {
            if (this.constVars.has(name)) {
                throw new Error(`TypeError: Assignment to constant variable '${name}'`)
            }
            this.values.set(name, value)
            return
        }
        if (this.parent !== null) {
            this.parent.assign(name, value)
            return
        }
        throw new Error(`Variable '${name}' is not declared or defined`)
    }
}

class CustomFunction {
    constructor(declaration, closure) {
        this.declaration = declaration
        this.closure = closure
    }

    call(interpreter, args) {
        let env = new Enviroment(this.closure)

        for (let i = 0; i < this.declaration.params.length; i++) {
            let paramName = this.declaration.params[i].value
            env.define(paramName, args[i] ?? null, false)
        }

        let previousEnv = interpreter.currentEnv
        try {
            interpreter.currentEnv = env
            interpreter.visit(this.declaration.body)
        } catch (e) {
            if (e instanceof ReturnException) {
                return e.value
            }
            throw e
        } finally {
            interpreter.currentEnv = previousEnv
        }

        return null
    }
}

class NativeFunction {
    constructor(fn, arity = null) {
        this.fn = fn
        this.arity = arity 
    }

    call(interpreter, args) {
        if (this.arity !== null && args.length !== this.arity) {
            throw new Error(`Expected ${this.arity} arguments, but got ${args.length}`)
        }
        return this.fn(interpreter, args)
    }
}

class ReturnException {
    constructor(value) {
        this.value = value
    }
}

class Interpreter extends NodeVisitor {

    constructor(parser) {
        super()

        this.parser = parser
        this.currentEnv = this.globals = new Enviroment()
        this.OUTPUT = []

        this.registerBuiltIns()
    }

    registerBuiltIns() {
        this.globals.define("random", new NativeFunction((interp, args) => {
            let [min = 0, max = 1] = args
            return Math.floor(Math.random() * (max - min + 1)) + min
        }, 2))

        this.globals.define("print", new NativeFunction((interp, args, node) => {
            let argument = args[0]
            let outputValue = argument === null || argument === undefined ? "null" : argument

            const now = new Date()
            const timeStr = now.toTimeString().split(' ')[0] + '.' +
                String(now.getMilliseconds()).padStart(3, "0")

            const formattedLog = `/* ${timeStr} */ | "${outputValue}"`

            console.log(formattedLog)
            interp.OUTPUT.push(formattedLog)
        }, 1))

        this.globals.define("len", new NativeFunction((interp, args) => {
            let argument = args[0]
            
            if (argument === null || argument === undefined) {
                return 0
            }

            if (typeof argument === "string" || Array.isArray(argument)) {
                return argument.length
            }

            if (typeof argument === "object") {
                return Object.keys(argument).length
            }
            
            throw new Error(`TypeError: len() is not supported for type ${typeof argument}`)
        }))
    }

    visit_Compound(node) {
        let previousEnv = this.currentEnv
        try {
            this.currentEnv = new Enviroment(previousEnv)
            for (let child of node.children) {
                this.visit(child)
            }
        } finally {
            this.currentEnv = previousEnv
        }
    }

    visit_VarDecl(node) {
        let value = node.exprNode ? this.visit(node.exprNode) : null
        this.currentEnv.define(node.varNode.value, value, false)
    }

    visit_ConstDecl(node) {
        let value = this.visit(node.exprNode)
        this.currentEnv.define(node.varNode.value, value, true)
    }

    visit_Assign(node) {
        let value = this.visit(node.right)
        this.currentEnv.assign(node.left.value, value)
    }

    visit_Var(node) {
        return this.currentEnv.get(node.value)
    }

    visit_Num(node) {
        return node.value
    }

    visit_Str(node) {
        return node.value
    }

    visit_Bool(node) {
        return node.value
    }

    visit_UnaryOp(node) {
        let val = this.visit(node.expr)
        if (node.op.type === TokenType.PLUS) return +val
        if (node.op.type === TokenType.MINUS) return -val
    }

    visit_BinOp(node) {
        let left = this.visit(node.left)
        let right = this.visit(node.right)

        switch (node.op.type) {
            case TokenType.PLUS:
                return left + right
            case TokenType.MINUS:
                return left - right
            case TokenType.MUL:
                return left * right
            case TokenType.DIV:
                return left / right
            case TokenType.POW:
                return Math.pow(left, right)
            case TokenType.SQRT:
                return Math.sqrt(left)
            case TokenType.EQUALS:
                return left === right
            case TokenType.NOT_EQUALS:
                return left !== right
            case TokenType.LESS_THAN:
                return left < right
            case TokenType.MORE_THAN:
                return left > right
            case TokenType.AND:
                return Boolean(left && right)
            case TokenType.OR:
                return Boolean(left || right)
            default:
                throw new Error(`Unknown operator token: ${node.op.type}`)
        }
    }

    visit_If(node) {
        let condition = this.visit(node.condition)
        if (condition) {
            this.visit(node.thenBranch)
        } else if (node.elseBranch) {
            this.visit(node.elseBranch)
        }
    }

    visit_While(node) {
        while(this.visit(node.condition)) {
            this.visit(node.body)
        }
    }

    visit_FunctionDecl(node) {
        let fn = new CustomFunction(node, this.currentEnv)
        this.currentEnv.define(node.fnName.value, fn, false)
    }

    visit_Call(node) {
        let callee = this.visit(node.callee)
        let args = node.args.map(arg => this.visit(arg))

        if (!callee || typeof callee.call !== "function") {
            let name = node.callee.value || "expression"
            throw new Error(`TypeError: '${name}' is not a function!`)
        }

        return callee.call(this, args, node)
    }

    visit_For(node) {
        let varName = node.variable.token.value
        let start = this.visit(node.start)
        let limit = this.visit(node.limit)
        let step = node.step ? this.visit(node.step) : 1
        
        if (this.currentEnv.declaredVars.has(varName)) {
            this.currentEnv.assign(varName, start)
        } else {
            this.currentEnv.define(varName, start, false)
        }

        if (step > 0) {
            for (let val = start; val <= limit; val += step) {
                this.currentEnv.assign(varName, val)
                this.visit(node.body)
            }
        } else if (step < 0) {
            for (let val = start; val >= limit; val += step) {
                this.currentEnv.assign(varName, val)
                this.visit(node.body)
            }
        }
    }

    // visit_Print(node) {
       
    // }

    visit_NoOp(node) {
        return null
    }

    interpret() {
        let tree = this.parser.parse()
        return this.visit(tree)
    }
}

module.exports = {
    Interpreter,
    NodeVisitor,
    Enviroment
}