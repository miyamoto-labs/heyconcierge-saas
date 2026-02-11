import os
import requests
from typing import Optional, Dict

class VirusTotalScanner:
    """
    Integration with VirusTotal for file scanning
    Requires VIRUSTOTAL_API_KEY environment variable
    """
    
    BASE_URL = "https://www.virustotal.com/api/v3/"
    
    def __init__(self):
        self.api_key = os.getenv("VIRUSTOTAL_API_KEY")
        self.enabled = bool(self.api_key)
    
    def scan_file(self, file_path: str) -> Optional[Dict]:
        """
        Upload and scan a file with VirusTotal
        Returns scan results or None if not enabled
        """
        if not self.enabled:
            return None
            
        try:
            # 1. Upload file
            with open(file_path, "rb") as f:
                files = {"file": (os.path.basename(file_path), f)}
                headers = {"x-apikey": self.api_key}
                
                upload_response = requests.post(
                    f"{self.BASE_URL}files",
                    headers=headers,
                    files=files
                )
                upload_response.raise_for_status()
                
                analysis_id = upload_response.json().get("data", {}).get("id")
                if not analysis_id:
                    return None
                
            # 2. Get analysis results
            analysis_response = requests.get(
                f"{self.BASE_URL}analyses/{analysis_id}",
                headers=headers
            )
            analysis_response.raise_for_status()
            
            return analysis_response.json()
            
        except Exception as e:
            print(f"VirusTotal scan failed: {str(e)}")
            return None
    
    def get_file_report(self, file_hash: str) -> Optional[Dict]:
        """
        Get existing scan report for a file by its hash
        """
        if not self.enabled:
            return None
            
        try:
            headers = {"x-apikey": self.api_key}
            response = requests.get(
                f"{self.BASE_URL}files/{file_hash}",
                headers=headers
            )
            response.raise_for_status()
            
            return response.json()
        except Exception as e:
            print(f"VirusTotal report fetch failed: {str(e)}")
            return None