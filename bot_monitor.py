#!/usr/bin/env python3
"""
Bot Monitor - Checks if trading bots are alive and healthy
Returns status that can be used by cron jobs
"""

import subprocess
import os
import time
from datetime import datetime, timedelta
from pathlib import Path

WORKSPACE = Path("/Users/erik/.openclaw/workspace")

def check_process_running(name_pattern: str) -> dict:
    """Check if a process matching the pattern is running"""
    try:
        result = subprocess.run(
            ["pgrep", "-f", name_pattern],
            capture_output=True, text=True
        )
        pids = result.stdout.strip().split('\n') if result.stdout.strip() else []
        return {
            "running": len(pids) > 0 and pids[0] != '',
            "pids": [p for p in pids if p],
            "count": len([p for p in pids if p])
        }
    except Exception as e:
        return {"running": False, "error": str(e), "pids": [], "count": 0}

def check_log_activity(log_file: str, max_age_minutes: int = 30) -> dict:
    """Check if log file has recent activity"""
    log_path = WORKSPACE / log_file
    if not log_path.exists():
        return {"active": False, "error": "Log file not found", "path": str(log_path)}
    
    try:
        mtime = datetime.fromtimestamp(log_path.stat().st_mtime)
        age_minutes = (datetime.now() - mtime).total_seconds() / 60
        
        # Read last few lines for status
        with open(log_path, 'r') as f:
            lines = f.readlines()
            last_lines = lines[-10:] if len(lines) >= 10 else lines
        
        # Check for errors in recent lines
        errors = [l for l in last_lines if 'error' in l.lower() or 'exception' in l.lower()]
        
        return {
            "active": age_minutes < max_age_minutes,
            "last_update_minutes": round(age_minutes, 1),
            "last_lines": len(lines),
            "recent_errors": len(errors),
            "path": str(log_path)
        }
    except Exception as e:
        return {"active": False, "error": str(e), "path": str(log_path)}

def get_bot_status():
    """Get comprehensive status of all bots"""
    status = {
        "timestamp": datetime.now().isoformat(),
        "bots": {}
    }
    
    # Hyperliquid Funding Rate Bot (ONLY ACTIVE BOT)
    hl_funding_process = check_process_running("hl_funding_bot.py")
    hl_funding_log = check_log_activity("hl_funding_bot.log", max_age_minutes=30)
    status["bots"]["hyperliquid_funding"] = {
        "name": "Hyperliquid Funding Rate Hunter",
        "process": hl_funding_process,
        "log": hl_funding_log,
        "healthy": hl_funding_process["running"] and hl_funding_log.get("active", False) and hl_funding_log.get("recent_errors", 0) == 0
    }
    
    # Overall health
    status["all_healthy"] = all(b["healthy"] for b in status["bots"].values())
    status["any_running"] = any(b["process"]["running"] for b in status["bots"].values())
    
    return status

def format_alert(status: dict) -> str:
    """Format status into an alert message if needed"""
    issues = []
    
    for bot_id, bot in status["bots"].items():
        if not bot["process"]["running"]:
            issues.append(f"🔴 {bot['name']}: NOT RUNNING")
        elif not bot["log"].get("active", False):
            age = bot["log"].get("last_update_minutes", "?")
            issues.append(f"🟡 {bot['name']}: No log activity for {age} min")
        elif bot["log"].get("recent_errors", 0) > 0:
            issues.append(f"🟠 {bot['name']}: {bot['log']['recent_errors']} recent errors in log")
    
    if issues:
        return "⚠️ BOT ALERT:\n" + "\n".join(issues)
    return None

if __name__ == "__main__":
    import json
    status = get_bot_status()
    
    alert = format_alert(status)
    if alert:
        print(alert)
        print("\n--- Full Status ---")
    
    print(json.dumps(status, indent=2))
