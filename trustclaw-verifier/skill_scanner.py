import os
import json
import re
from typing import Dict, List, Optional
from pathlib import Path

class SkillScanner:
    """
    Main verification engine for OpenClaw skills
    Scans for suspicious patterns, validates structure, and generates trust scores
    """
    
    def __init__(self, skill_path: str):
        self.skill_path = Path(skill_path)
        self.trust_score = 50  # Base score
        self.findings = []
        self.skill_json = {}
        
    def scan(self) -> Dict:
        """Main scanning workflow"""
        try:
            self._validate_structure()
            self._parse_skill_json()
            self._scan_files_for_suspicious_patterns()
            self._check_dependencies()
            self._calculate_final_score()
            
            return {
                "trust_score": self.trust_score,
                "findings": self.findings,
                "skill_metadata": self.skill_json
            }
        except Exception as e:
            return {"error": str(e), "trust_score": 0}
    
    def _validate_structure(self):
        """Check for required files and valid structure"""
        required_files = ["SKILL.md", "skill.json"]
        
        for file in required_files:
            if not (self.skill_path / file).exists():
                self.findings.append(f"Missing required file: {file}")
                self.trust_score -= 10
            
        # Check SKILL.md structure
        skill_md = self.skill_path / "SKILL.md"
        if skill_md.exists():
            content = skill_md.read_text()
            if "# Description" in content and "# Usage" in content:
                self.trust_score += 10
            else:
                self.findings.append("SKILL.md missing required sections")
                self.trust_score -= 5
    
    def _parse_skill_json(self):
        """Parse and validate skill.json"""
        try:
            with open(self.skill_path / "skill.json") as f:
                self.skill_json = json.load(f)
                
            # Check for verified author
            if self.skill_json.get("author", {}).get("verified", False):
                self.trust_score += 5
        except Exception as e:
            self.findings.append(f"Invalid skill.json: {str(e)}")
            self.trust_score -= 15
    
    def _scan_files_for_suspicious_patterns(self):
        """Scan all files for dangerous patterns"""
        suspicious_patterns = [
            (r"(exec|eval|os\.system|subprocess\.run)\(", "Dangerous system call"),
            (r"(requests\.|urllib\.|http\.client\.)", "Network call detected"),
            (r"(AWS_|GCP_|API_)?[A-Z0-9_]{10,}", "Possible hardcoded credential"),
            (r"(0x)?[0-9a-fA-F]{40}", "Possible cryptocurrency wallet address"),
            (r"(base64\.b64decode|zlib\.decompress|marshal\.loads)", "Possible code obfuscation")
        ]
        
        clean = True
        for root, _, files in os.walk(self.skill_path):
            for file in files:
                if file.endswith(".py"):  # Focus on Python files
                    path = Path(root) / file
                    content = path.read_text()
                    
                    for pattern, description in suspicious_patterns:
                        if re.search(pattern, content):
                            self.findings.append(f"{description} in {path.relative_to(self.skill_path)}")
                            clean = False
        
        if clean:
            self.trust_score += 15
        else:
            self.trust_score -= 30
    
    def _check_dependencies(self):
        """Check dependencies for known vulnerabilities"""
        # TODO: Implement actual dependency scanning
        # For now, we'll assume clean if requirements.txt exists
        req_file = self.skill_path / "requirements.txt"
        if req_file.exists():
            self.trust_score += 20
        else:
            self.findings.append("No requirements.txt found")
            self.trust_score -= 10
    
    def _calculate_final_score(self):
        """Ensure score is within bounds"""
        self.trust_score = max(0, min(100, self.trust_score))


def scan_skill(skill_path: str) -> Dict:
    """Public interface for scanning a skill"""
    scanner = SkillScanner(skill_path)
    return scanner.scan()