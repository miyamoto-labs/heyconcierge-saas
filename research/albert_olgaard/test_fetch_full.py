#!/usr/bin/env python3
import requests
import json
import re
import xml.etree.ElementTree as ET
import sys

# Unbuffered output
sys.stdout.reconfigure(line_buffering=True)
sys.stderr.reconfigure(line_buffering=True)

# Load captured YouTube auth
print("Loading auth...", flush=True)
with open('/Users/erik/.openclaw/skills/youtube/auth.json', 'r') as f:
    auth = json.load(f)

headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    **auth['headers']
}
cookies = auth['cookies']

video_id = "G3J-H7bnYSg"
video_url = f"https://www.youtube.com/watch?v={video_id}"

print(f"Fetching video page: {video_url}", flush=True)
response = requests.get(video_url, headers=headers, cookies=cookies, timeout=30)
print(f"Status: {response.status_code}", flush=True)

# Extract caption URL
match = re.search(r'"captionTracks":(\[.*?\])', response.text)
if not match:
    print("✗ No captionTracks found", flush=True)
    sys.exit(1)

caption_tracks = json.loads(match.group(1))
transcript_url = caption_tracks[0]['baseUrl']
print(f"Transcript URL: {transcript_url[:100]}...", flush=True)

# Fetch transcript
print("Fetching transcript XML...", flush=True)
transcript_response = requests.get(transcript_url, headers=headers, cookies=cookies, timeout=30)
print(f"Transcript status: {transcript_response.status_code}", flush=True)
print(f"Transcript length: {len(transcript_response.text)} bytes", flush=True)

# Parse XML
print("Parsing XML...", flush=True)
root = ET.fromstring(transcript_response.text)
text_parts = []
for text_elem in root.findall('.//text'):
    text = text_elem.text or ""
    text = text.replace('&amp;#39;', "'").replace('&amp;quot;', '"').replace('&amp;', '&')
    text_parts.append(text.strip())

transcript_text = " ".join(text_parts)
print(f"✓ Extracted {len(transcript_text)} characters", flush=True)
print(f"First 200 chars: {transcript_text[:200]}", flush=True)

# Save
output_path = "/Users/erik/.openclaw/workspace/research/albert_olgaard/transcripts/G3J-H7bnYSg.txt"
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(f"VIDEO: How I'd start an AI Agency in 2026 (3 HOURS Course)\n")
    f.write(f"ID: {video_id}\n")
    f.write(f"URL: {video_url}\n")
    f.write("="*80 + "\n\n")
    f.write(transcript_text)

print(f"✓ Saved to {output_path}", flush=True)
