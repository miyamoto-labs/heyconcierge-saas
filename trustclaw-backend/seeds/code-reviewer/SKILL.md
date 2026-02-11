# Code Reviewer

Static analysis code reviewer. Checks for common issues, style problems, and potential bugs.

## Usage
```bash
./reviewer.py myfile.py
./reviewer.py script.js
cat code.py | ./reviewer.py --stdin
```

## Checks
- Unused imports, long lines, TODO/FIXME markers
- Potential security issues (eval, exec, shell injection)
- Common anti-patterns

## Safety
- Read-only file access
- No network access
- No code execution — static analysis only
