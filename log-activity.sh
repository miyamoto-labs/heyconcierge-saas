#!/bin/bash
# Usage: ./log-activity.sh "Agent Name" "Action description" "success|fail" "Details"
ACTIVITY_FILE="/Users/erik/.openclaw/workspace/agent-activity.json"
AGENT="${1:?Usage: $0 agent action result details}"
ACTION="${2:?}"
RESULT="${3:-success}"
DETAILS="${4:-}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
ID="a$(date +%s)"

# Create file if missing
[ -f "$ACTIVITY_FILE" ] || echo '[]' > "$ACTIVITY_FILE"

# Prepend new entry (keep last 200)
python3 -c "
import json,sys
with open('$ACTIVITY_FILE') as f: data=json.load(f)
data.insert(0,{'id':'$ID','timestamp':'$TIMESTAMP','agent':'''$AGENT''','action':'''$ACTION''','result':'$RESULT','details':'''$DETAILS'''})
with open('$ACTIVITY_FILE','w') as f: json.dump(data[:200],f,indent=2)
"
echo "✅ Logged: $AGENT - $ACTION ($RESULT)"
