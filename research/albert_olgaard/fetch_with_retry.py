#!/usr/bin/env python3
import requests
import json
import os
import re
import xml.etree.ElementTree as ET
import time
import sys

# Unbuffered output
class Unbuffered:
   def __init__(self, stream):
       self.stream = stream
   def write(self, data):
       self.stream.write(data)
       self.stream.flush()
   def writelines(self, datas):
       self.stream.writelines(datas)
       self.stream.flush()
   def __getattr__(self, attr):
       return getattr(self.stream, attr)

sys.stdout = Unbuffered(sys.stdout)
sys.stderr = Unbuffered(sys.stderr)

# Load captured YouTube auth
with open('/Users/erik/.openclaw/skills/youtube/auth.json', 'r') as f:
    auth = json.load(f)

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

def get_transcript_with_retry(video_id, max_retries=3):
    """Fetch transcript with retry logic and rate limit handling"""
    
    video_url = f"https://www.youtube.com/watch?v={video_id}"
    
    for attempt in range(max_retries):
        try:
            # Fetch video page
            response = requests.get(video_url, headers=headers, cookies=cookies, timeout=30)
            
            if response.status_code != 200:
                print(f"    Video page error: {response.status_code}")
                if attempt < max_retries - 1:
                    time.sleep(5)
                    continue
                return None, f"Video page error: {response.status_code}"
            
            # Extract caption URL
            match = re.search(r'"captionTracks":(\[.*?\])', response.text)
            if not match:
                return None, "No captions found"
            
            caption_tracks = json.loads(match.group(1))
            transcript_url = caption_tracks[0]['baseUrl']
            
            # Add delay before transcript request
            time.sleep(2)
            
            # Fetch transcript
            transcript_response = requests.get(transcript_url, headers=headers, cookies=cookies, timeout=30)
            
            if transcript_response.status_code == 429:
                wait_time = 10 * (attempt + 1)
                print(f"    Rate limited! Waiting {wait_time}s...")
                time.sleep(wait_time)
                continue
            
            if transcript_response.status_code != 200:
                return None, f"Transcript error: {transcript_response.status_code}"
            
            # Parse XML
            root = ET.fromstring(transcript_response.text)
            text_parts = []
            for text_elem in root.findall('.//text'):
                text = text_elem.text or ""
                text = text.replace('&#39;', "'").replace('&quot;', '"').replace('&amp;', '&')
                text_parts.append(text.strip())
            
            transcript_text = " ".join(text_parts)
            
            if not transcript_text:
                return None, "Empty transcript"
            
            return transcript_text, None
            
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"    Error: {str(e)}, retrying...")
                time.sleep(5)
                continue
            return None, str(e)
    
    return None, "Max retries exceeded"

print(f"Fetching transcripts for {len(videos)} videos...")
print(f"Using captured YouTube auth with rate limit handling")
print("="*80 + "\n")

for idx, (video_id, title) in enumerate(videos, 1):
    print(f"[{idx}/{len(videos)}] {title[:50]}... ({video_id})")
    
    # Check if already exists
    output_path = f"{output_dir}/{video_id}.txt"
    if os.path.exists(output_path) and os.path.getsize(output_path) > 1000:
        print(f"  ✓ Already exists, skipping")
        success_count += 1
        continue
    
    try:
        transcript_text, error = get_transcript_with_retry(video_id)
        
        if error:
            print(f"  ✗ Failed: {error}")
            failed_videos.append((video_id, title, error))
            continue
        
        # Save transcript
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(f"VIDEO: {title}\n")
            f.write(f"ID: {video_id}\n")
            f.write(f"URL: https://www.youtube.com/watch?v={video_id}\n")
            f.write("="*80 + "\n\n")
            f.write(transcript_text)
        
        success_count += 1
        print(f"  ✓ Saved ({len(transcript_text):,} chars)")
        
        # Rate limit: wait between videos
        time.sleep(3)
        
    except Exception as e:
        print(f"  ✗ Exception: {str(e)}")
        failed_videos.append((video_id, title, str(e)))

print(f"\n{'='*80}")
print(f"RESULTS: {success_count}/{len(videos)} transcripts downloaded")
if failed_videos:
    print(f"\nFailed videos ({len(failed_videos)}):")
    for vid_id, vid_title, error in failed_videos:
        print(f"  - {vid_title} ({vid_id}): {error}")
else:
    print("\n🎉 All transcripts downloaded successfully!")
