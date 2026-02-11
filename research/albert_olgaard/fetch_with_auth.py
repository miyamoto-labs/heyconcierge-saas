#!/usr/bin/env python3
import requests
import json
import os
import re
import xml.etree.ElementTree as ET

# Load captured YouTube auth
with open('/Users/erik/.openclaw/skills/youtube/auth.json', 'r') as f:
    auth = json.load(f)

# Prepare headers and cookies
headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    **auth['headers']
}
cookies = auth['cookies']

# All video IDs and titles
videos = [
    ("G3J-H7bnYSg", "How I'd start an AI Agency in 2026 (3 HOURS Course)"),
    ("Z7qTuS11vI4", "STOP selling AI agents. Do this instead..."),
    ("1DIfz4avryA", "I built my own Hormozi AI... it made me $40k in 24 hours"),
    ("aY6DIrfZT0g", "If I Started an AI agency in 2026, I'd Do This"),
    ("QSygo_N-Sng", "The BEST Niches for AI Agency in 2026"),
    ("ICJXLOxWl0I", "How To Build AI Agents in 2026 (BuildMyAgent Full Course)"),
    ("L4ISlAF84lw", "How To Make Your First $10K with AI"),
    ("JsaAq9OgK8o", "I almost lost $1,000,000"),
    ("binhk4lP35k", "Your Expectations Are Killing Your Success."),
    ("q-wLnr0Pk_0", "how I made $1M at 23yo"),
    ("0YEI9Jt1tN0", "I built this AI Agent in 1 hour (and got paid $1200)"),
    ("zz7ke5URHio", "How I'd Make My First $1M with AI in 2026 (If I had To Start Over)"),
    ("9FTeN8BeM8U", "You need to UNLEARN what they taught you in school"),
    ("zHfu6nBT15c", "How to Make So Much Money Your Parents Think you Sell Drugs"),
    ("Zc6eqCluh80", "This is the end of AI Agencies?"),
    ("iEmTgKLpb0o", "Build & Sell AI Agents (Free 6 Hour Course)"),
    ("StbMppArV14", "The Cheapest Way To Host N8N (Save 84%)"),
    ("a4z9VzsYxEA", "Give me 58 sec... I'll DELETE your fear of being replaced by AI"),
    ("Gsvo-SICtfY", "How to build an AI Agency (Free Course)"),
    ("6eftheUv9aE", "Copy & Paste THIS AI Agent To Make Your First $5000"),
    ("x__xSzlp0rE", "The $20k/month Villa That Selling AI Agents Got Me"),
    ("QDSHVNpuTTg", "5 steps to ACTUALLY lock in"),
    ("cNnkQdcJ6UU", "If you do this... it's unfair not to win"),
    ("hiISvqQOK-o", "I Ranked Business Models that Will Make You Rich in 2026"),
    ("dWARlOatpzQ", "Sell this AI app for $10K (No Code)"),
    ("AShyOwbXvIw", "How to get your first AI Automation client in 7 days (Must Watch!)"),
    ("BylFXk7jCDE", "I Built a $1M AI App (No Code)"),
    ("exhvAKKnuPk", "How I can work 14 hours a day (without burning out)"),
    ("TtnBzHsQslY", "How to charge 10x more for your AI Agents (Beginners guide)"),
    ("sIjilLdDFeE", "This AI agent makes me $32,655 every month"),
    ("KpzIl2h4XyI", "How to go from 0-$40k/mo with your AI Agency"),
    ("VctoUF-Rqx8", "Google VEO 3 for FREE and UNLIMITED (2025 method)"),
    ("ECThFVM_kpU", "you will never be happy..."),
    ("fGhPU8-bfWA", "Start Your AI Agency in 2025 (3+ HOUR FREE COURSE)"),
    ("OEkH9aYCuz8", "pov: you achieved financial freedom at 22 yo"),
    ("4bKgLcZyV8I", "How I Grew My Instagram from 0 to 100K in 3 Months"),
    ("0pztV2Xjw-A", "How to Run B2B Ads for Your AI Agency"),
    ("EvcCL4iCgN4", "the gurus are lying to you..."),
    ("DiaC0eeaX9s", "How I Print $1,000/Day Selling AI to Boomer Businesses"),
    ("I4tWZqrlRS4", "This website made me $367,000 (giving you a copy)"),
    ("Q5TEozKCXTk", "Complete Beginners Guide to an AI Agency in 2025 (2+ Hours)"),
    ("lGh0K4F2lvY", "non-guru explains how to print with an AI agency")
]

output_dir = "/Users/erik/.openclaw/workspace/research/albert_olgaard/transcripts"
success_count = 0
failed_videos = []

def get_transcript_url(video_id):
    """Get transcript URL from video page"""
    try:
        video_url = f"https://www.youtube.com/watch?v={video_id}"
        response = requests.get(video_url, headers=headers, cookies=cookies, timeout=30)
        
        # Find captionTracks in the page
        match = re.search(r'"captionTracks":(\[.*?\])', response.text)
        if not match:
            return None
            
        caption_tracks = json.loads(match.group(1))
        
        # Find English captions
        for track in caption_tracks:
            if track.get('languageCode') == 'en':
                return track['baseUrl']
        
        # Fallback to first available
        if caption_tracks:
            return caption_tracks[0]['baseUrl']
        
        return None
    except Exception as e:
        print(f"  Error getting transcript URL: {e}")
        return None

def clean_transcript(xml_text):
    """Parse XML transcript and extract clean text"""
    try:
        root = ET.fromstring(xml_text)
        text_parts = []
        for text_elem in root.findall('.//text'):
            text = text_elem.text or ""
            # Decode HTML entities
            text = text.replace('&amp;#39;', "'").replace('&amp;quot;', '"').replace('&amp;', '&')
            text_parts.append(text.strip())
        return " ".join(text_parts)
    except Exception as e:
        print(f"  Error parsing transcript XML: {e}")
        return None

print(f"Fetching transcripts for {len(videos)} videos using captured YouTube auth...")
print(f"API Key: {auth['headers']['x-goog-api-key'][:20]}...")
print("="*80 + "\n")

for idx, (video_id, title) in enumerate(videos, 1):
    try:
        print(f"[{idx}/{len(videos)}] {title[:60]}... ({video_id})")
        
        # Get transcript URL from video page
        transcript_url = get_transcript_url(video_id)
        
        if not transcript_url:
            print(f"  ✗ No transcript found")
            failed_videos.append((video_id, title, "No transcript available"))
            continue
        
        # Fetch transcript
        print(f"  Fetching transcript...")
        response = requests.get(transcript_url, headers=headers, cookies=cookies, timeout=30)
        response.raise_for_status()
        
        # Clean transcript
        text = clean_transcript(response.text)
        
        if not text:
            print(f"  ✗ Failed to parse transcript")
            failed_videos.append((video_id, title, "Failed to parse"))
            continue
        
        # Save transcript
        output_path = f"{output_dir}/{video_id}.txt"
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(f"VIDEO: {title}\n")
            f.write(f"ID: {video_id}\n")
            f.write(f"URL: https://www.youtube.com/watch?v={video_id}\n")
            f.write("="*80 + "\n\n")
            f.write(text)
        
        success_count += 1
        print(f"  ✓ Saved ({len(text):,} chars)")
        
    except Exception as e:
        print(f"  ✗ Failed: {str(e)}")
        failed_videos.append((video_id, title, str(e)))

print(f"\n{'='*80}")
print(f"RESULTS: {success_count}/{len(videos)} transcripts downloaded")
if failed_videos:
    print(f"\nFailed videos ({len(failed_videos)}):")
    for vid_id, vid_title, error in failed_videos:
        print(f"  - {vid_title} ({vid_id}): {error}")
else:
    print("\n🎉 All transcripts downloaded successfully!")
