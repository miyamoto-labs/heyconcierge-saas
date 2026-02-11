#!/usr/bin/env python3
import requests
import json
import re
import xml.etree.ElementTree as ET

# Load captured YouTube auth
with open('/Users/erik/.openclaw/skills/youtube/auth.json', 'r') as f:
    auth = json.load(f)

headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    **auth['headers']
}
cookies = auth['cookies']

video_id = "G3J-H7bnYSg"
video_url = f"https://www.youtube.com/watch?v={video_id}"

print(f"Fetching video page: {video_url}")
response = requests.get(video_url, headers=headers, cookies=cookies, timeout=30)
print(f"Status: {response.status_code}")
print(f"Content length: {len(response.text)}")

# Try to find captionTracks
if '"captionTracks"' in response.text:
    print("✓ Found captionTracks in page")
    match = re.search(r'"captionTracks":(\[.*?\])', response.text)
    if match:
        caption_tracks = json.loads(match.group(1))
        print(f"✓ Found {len(caption_tracks)} caption tracks")
        for track in caption_tracks:
            print(f"  - {track.get('languageCode')}: {track.get('baseUrl')[:80]}...")
else:
    print("✗ No captionTracks found in page")
    # Try to find what's there
    if 'ytInitialPlayerResponse' in response.text:
        print("  Found ytInitialPlayerResponse")
    if 'captionsPanel' in response.text:
        print("  Found captionsPanel")
