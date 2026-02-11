from fastapi import FastAPI, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uuid
import os
from typing import Dict
from pathlib import Path
import asyncio
from .skill_scanner import scan_skill

app = FastAPI(title="TrustClaw Verification API",
              description="API for scanning OpenClaw skills for security issues")

# In-memory storage for scan results (replace with Redis in production)
SCAN_RESULTS: Dict[str, Dict] = {}
SCAN_DIR = Path("/tmp/trustclaw_scans")

class ScanRequest(BaseModel):
    skill_url: str
    webhook_url: Optional[str] = None

@app.post("/scan")
async def create_scan(request: ScanRequest):
    """
    Initiate a new skill scan
    Returns immediately with scan ID, processing happens in background
    """
    scan_id = str(uuid.uuid4())
    
    # Create initial result record
    SCAN_RESULTS[scan_id] = {
        "status": "pending",
        "skill_url": request.skill_url,
        "webhook_url": request.webhook_url
    }
    
    # Start background task
    asyncio.create_task(_process_scan(scan_id, request.skill_url))
    
    return {"scan_id": scan_id, "status_url": f"/scan/{scan_id}"}

@app.get("/scan/{scan_id}")
async def get_scan_results(scan_id: str):
    """
    Get scan results by ID
    """
    if scan_id not in SCAN_RESULTS:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, 
                           detail="Scan ID not found")
    
    return SCAN_RESULTS[scan_id]

async def _process_scan(scan_id: str, skill_url: str):
    """
    Background task to process the scan
    """
    try:
        # 1. Clone/download the skill
        skill_path = SCAN_DIR / scan_id
        os.makedirs(skill_path, exist_ok=True)
        
        # TODO: Implement actual download from URL
        # For now we'll simulate a successful download
        
        # 2. Run the scanner
        result = scan_skill(str(skill_path))
        
        # 3. Update results
        SCAN_RESULTS[scan_id].update({
            "status": "complete",
            "result": result
        })
        
        # 4. Call webhook if provided
        if SCAN_RESULTS[scan_id].get("webhook_url"):
            # TODO: Implement webhook call
            pass
            
    except Exception as e:
        SCAN_RESULTS[scan_id].update({
            "status": "failed",
            "error": str(e)
        })