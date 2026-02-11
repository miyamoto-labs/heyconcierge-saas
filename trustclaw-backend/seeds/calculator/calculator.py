#!/usr/bin/env python3
"""Safe calculator - evaluates math expressions without eval()."""
import ast
import math
import operator
import sys

SAFE_OPS = {
    ast.Add: operator.add, ast.Sub: operator.sub,
    ast.Mult: operator.mul, ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv, ast.Mod: operator.mod,
    ast.Pow: operator.pow, ast.USub: operator.neg, ast.UAdd: operator.pos,
}

SAFE_FUNCS = {
    'abs': abs, 'round': round, 'min': min, 'max': max,
    'sqrt': math.sqrt, 'log': math.log, 'log10': math.log10,
    'sin': math.sin, 'cos': math.cos, 'tan': math.tan,
    'ceil': math.ceil, 'floor': math.floor,
}

SAFE_CONSTS = {'pi': math.pi, 'e': math.e, 'tau': math.tau}

def safe_eval(node):
    if isinstance(node, ast.Expression):
        return safe_eval(node.body)
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
        return node.value
    if isinstance(node, ast.Name) and node.id in SAFE_CONSTS:
        return SAFE_CONSTS[node.id]
    if isinstance(node, ast.UnaryOp) and type(node.op) in SAFE_OPS:
        return SAFE_OPS[type(node.op)](safe_eval(node.operand))
    if isinstance(node, ast.BinOp) and type(node.op) in SAFE_OPS:
        return SAFE_OPS[type(node.op)](safe_eval(node.left), safe_eval(node.right))
    if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id in SAFE_FUNCS:
        args = [safe_eval(a) for a in node.args]
        return SAFE_FUNCS[node.func.id](*args)
    raise ValueError(f"Unsupported expression: {ast.dump(node)}")

if __name__ == "__main__":
    expr = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else input("Expression: ")
    try:
        tree = ast.parse(expr, mode='eval')
        result = safe_eval(tree)
        print(f"{expr} = {result}")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
