#!/bin/bash

VIDEO_ID="G3J-H7bnYSg"
TITLE="How I'd start an AI Agency in 2026 (3 HOURS Course)"
OUTPUT_DIR="/Users/erik/.openclaw/workspace/research/albert_olgaard/transcripts"

# Get video page to extract caption track info
VIDEO_URL="https://www.youtube.com/watch?v=${VIDEO_ID}"
PAGE=$(curl -s "$VIDEO_URL")

# Extract caption track URL (look for "captionTracks" in the page)
CAPTION_URL=$(echo "$PAGE" | grep -o '"captionTracks":\[{"baseUrl":"[^"]*' | sed 's/.*"baseUrl":"//' | head -1)

if [ -z "$CAPTION_URL" ]; then
    echo "No captions found for $VIDEO_ID"
    exit 1
fi

# Fetch captions
CAPTIONS=$(curl -s "$CAPTION_URL")

# Parse and clean (remove XML tags)
TEXT=$(echo "$CAPTIONS" | sed 's/<[^>]*>//g' | sed 's/&amp;#39;/'"'"'/g' | sed 's/&amp;quot;/"/g' | sed 's/&amp;/\&/g' | tr '\n' ' ')

# Save to file
OUTPUT_FILE="$OUTPUT_DIR/${VIDEO_ID}.txt"
echo "VIDEO: $TITLE" > "$OUTPUT_FILE"
echo "ID: $VIDEO_ID" >> "$OUTPUT_FILE"
echo "URL: $VIDEO_URL" >> "$OUTPUT_FILE"
echo "================================================================================" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "$TEXT" >> "$OUTPUT_FILE"

echo "✓ Saved transcript for $VIDEO_ID ($(echo "$TEXT" | wc -c) chars)"
