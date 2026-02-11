#!/usr/bin/env python3
"""Static code reviewer - checks for common issues without executing code."""
import sys
import re

SECURITY_PATTERNS = [
    (r'\beval\s*\(', "⚠️  SECURITY: eval() usage detected - potential code injection"),
    (r'\bexec\s*\(', "⚠️  SECURITY: exec() usage detected - potential code injection"),
    (r'subprocess\.call\(.+shell\s*=\s*True', "⚠️  SECURITY: shell=True in subprocess - potential injection"),
    (r'os\.system\s*\(', "⚠️  SECURITY: os.system() usage - prefer subprocess"),
    (r'pickle\.loads?\s*\(', "⚠️  SECURITY: pickle deserialization - potential arbitrary code execution"),
    (r'__import__\s*\(', "⚠️  SECURITY: dynamic import detected"),
]

STYLE_PATTERNS = [
    (r'#\s*TODO', "📝 TODO marker found"),
    (r'#\s*FIXME', "📝 FIXME marker found"),
    (r'#\s*HACK', "📝 HACK marker found"),
    (r'except\s*:', "⚡ Bare except clause - catches all exceptions including KeyboardInterrupt"),
    (r'import \*', "⚡ Wildcard import - pollutes namespace"),
]

def review(code: str, filename: str = "<stdin>") -> list:
    issues = []
    lines = code.split('\n')
    
    for i, line in enumerate(lines, 1):
        # Line length
        if len(line) > 120:
            issues.append(f"  L{i}: 📏 Line too long ({len(line)} chars)")
        
        # Security patterns
        for pattern, msg in SECURITY_PATTERNS:
            if re.search(pattern, line):
                issues.append(f"  L{i}: {msg}")
        
        # Style patterns
        for pattern, msg in STYLE_PATTERNS:
            if re.search(pattern, line, re.IGNORECASE):
                issues.append(f"  L{i}: {msg}")
        
        # Trailing whitespace
        if line != line.rstrip() and line.strip():
            issues.append(f"  L{i}: 🔧 Trailing whitespace")
    
    # File-level checks
    if lines and not lines[-1].strip() == '' and lines[-1]:
        issues.append("  EOF: 🔧 No newline at end of file")
    if len(lines) > 500:
        issues.append(f"  📐 Large file ({len(lines)} lines) - consider splitting")
    
    return issues

if __name__ == "__main__":
    if "--stdin" in sys.argv or (len(sys.argv) == 1 and not sys.stdin.isatty()):
        code = sys.stdin.read()
        filename = "<stdin>"
    elif len(sys.argv) > 1 and sys.argv[1] != "--stdin":
        filename = sys.argv[1]
        with open(filename) as f:
            code = f.read()
    else:
        print("Usage: ./reviewer.py <file> | --stdin")
        sys.exit(1)
    
    issues = review(code, filename)
    print(f"🔍 Code Review: {filename}")
    print(f"   Lines: {len(code.splitlines())}")
    if issues:
        print(f"   Issues: {len(issues)}\n")
        for issue in issues:
            print(issue)
    else:
        print("   ✅ No issues found!")
