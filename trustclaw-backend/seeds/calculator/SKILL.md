# Calculator

Safe math operations using Python. Supports arithmetic, powers, roots, trig, and more.

## Usage
```bash
./calculator.py "2 + 2"
./calculator.py "sqrt(144) + 3**2"
./calculator.py "sin(pi/4)"
```

## Safety
- Uses Python `ast` module for safe expression evaluation
- No `eval()` or `exec()` — only math operations allowed
- No file/network access
