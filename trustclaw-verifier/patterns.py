"""
Database of suspicious patterns for TrustClaw scanner
"""

SUSPICIOUS_PATTERNS = [
    # Dangerous system calls
    {
        "name": "System Command Execution",
        "pattern": r"(exec|eval|os\.system|subprocess\.run|subprocess\.Popen)\(",
        "severity": "critical",
        "description": "Direct system command execution can be dangerous"
    },
    
    # Network calls
    {
        "name": "Network Operations",
        "pattern": r"(requests\.|urllib\.|http\.client\.|socket\.)",
        "severity": "high",
        "description": "Network calls may indicate data exfiltration"
    },
    
    # Credential patterns
    {
        "name": "Hardcoded Credentials",
        "pattern": r"(AWS_|GCP_|API_|SECRET_|TOKEN_|KEY_)[A-Z0-9_]+",
        "severity": "critical",
        "description": "Possible hardcoded credentials in code"
    },
    
    # Crypto wallets
    {
        "name": "Cryptocurrency Wallet",
        "pattern": r"(0x)?[0-9a-fA-F]{40}",
        "severity": "high",
        "description": "Possible cryptocurrency wallet address"
    },
    
    # Obfuscation techniques
    {
        "name": "Code Obfuscation",
        "pattern": r"(base64\.b64decode|zlib\.decompress|marshal\.loads|pickle\.loads|\\.decode\('rot13'\|)",
        "severity": "medium",
        "description": "Possible code obfuscation techniques"
    },
    
    # File system access
    {
        "name": "File System Access",
        "pattern": r"(open\(|os\.(remove|rename|chmod|chown)|shutil\.(rmtree|move))\(",
        "severity": "high",
        "description": "Potentially dangerous file system operations"
    },
    
    # Environment manipulation
    {
        "name": "Environment Manipulation",
        "pattern": r"os\.(environ|putenv|unsetenv)",
        "severity": "medium",
        "description": "Environment variable manipulation"
    }
]

DEPENDENCY_BLACKLIST = [
    "pyobfuscate",
    "pyarmor",
    "pyminifier",
    "uncompyle6",
    "decompyle3",
    "pyinstxtractor"
]