#!/usr/bin/env python3
import yt_dlp
import os
import re

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

def clean_vtt(text):
    """Remove VTT formatting and clean up text"""
    # Remove WEBVTT header
    text = re.sub(r'WEBVTT.*?\n\n', '', text, flags=re.DOTALL)
    # Remove timestamps
    text = re.sub(r'\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}.*?\n', '', text)
    # Remove cue identifiers (numbers)
    text = re.sub(r'^\d+\n', '', text, flags=re.MULTILINE)
    # Remove tags
    text = re.sub(r'<[^>]+>', '', text)
    # Clean up multiple newlines
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Remove leading/trailing whitespace from each line
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    return ' '.join(lines)

for video_id, title in videos:
    try:
        print(f"Fetching: {title} ({video_id})...")
        url = f"https://www.youtube.com/watch?v={video_id}"
        
        ydl_opts = {
            'skip_download': True,
            'writesubtitles': True,
            'writeautomaticsub': True,
            'subtitleslangs': ['en'],
            'subtitlesformat': 'vtt',
            'outtmpl': f'{output_dir}/{video_id}',
            'quiet': True,
            'no_warnings': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            # Try to get subtitles
            subtitles = info.get('subtitles', {}).get('en') or info.get('automatic_captions', {}).get('en')
            
            if subtitles:
                # Find VTT format
                vtt_sub = None
                for sub in subtitles:
                    if sub.get('ext') == 'vtt':
                        vtt_sub = sub
                        break
                
                if vtt_sub:
                    # Download subtitle content
                    import urllib.request
                    with urllib.request.urlopen(vtt_sub['url']) as response:
                        vtt_content = response.read().decode('utf-8')
                    
                    # Clean and extract text
                    text = clean_vtt(vtt_content)
                    
                    # Save transcript
                    output_path = f"{output_dir}/{video_id}.txt"
                    with open(output_path, 'w', encoding='utf-8') as f:
                        f.write(f"VIDEO: {title}\n")
                        f.write(f"ID: {video_id}\n")
                        f.write(f"URL: {url}\n")
                        f.write("="*80 + "\n\n")
                        f.write(text)
                    
                    success_count += 1
                    print(f"✓ Saved ({len(text)} chars)")
                else:
                    print(f"✗ No VTT subtitles found")
                    failed_videos.append((video_id, title, "No VTT format available"))
            else:
                print(f"✗ No subtitles available")
                failed_videos.append((video_id, title, "No subtitles available"))
        
    except Exception as e:
        print(f"✗ Failed: {str(e)}")
        failed_videos.append((video_id, title, str(e)))

print(f"\n{'='*80}")
print(f"RESULTS: {success_count}/{len(videos)} transcripts downloaded")
if failed_videos:
    print(f"\nFailed videos ({len(failed_videos)}):")
    for vid_id, vid_title, error in failed_videos:
        print(f"  - {vid_title} ({vid_id}): {error}")
