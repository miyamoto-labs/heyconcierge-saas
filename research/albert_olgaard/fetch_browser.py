#!/usr/bin/env python3
"""
Fetch YouTube transcripts using Playwright browser automation
This bypasses YouTube's bot detection by using a real browser
"""
import json
import os
import time

# Video list
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

OUTPUT_DIR = "/Users/erik/.openclaw/workspace/research/albert_olgaard/transcripts"
success_count = 0
failed_videos = []

# JavaScript to extract transcript from YouTube page
EXTRACT_TRANSCRIPT_JS = """
async () => {
    // Wait for captions data to be available
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try to find captions in the page data
    const scripts = document.querySelectorAll('script');
    let captionTracks = null;
    
    for (const script of scripts) {
        const content = script.textContent;
        if (content.includes('captionTracks')) {
            try {
                // Extract the ytInitialPlayerResponse object
                const match = content.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
                if (match) {
                    const data = JSON.parse(match[1]);
                    captionTracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
                    if (captionTracks && captionTracks.length > 0) {
                        break;
                    }
                }
            } catch (e) {
                continue;
            }
        }
    }
    
    if (!captionTracks || captionTracks.length === 0) {
        return { error: 'No captions found' };
    }
    
    // Find English captions
    const englishTrack = captionTracks.find(track => track.languageCode === 'en') || captionTracks[0];
    const captionUrl = englishTrack.baseUrl;
    
    // Fetch the caption content
    const response = await fetch(captionUrl);
    const xmlText = await response.text();
    
    // Parse XML and extract text
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    const textNodes = xmlDoc.querySelectorAll('text');
    
    let transcript = '';
    textNodes.forEach(node => {
        transcript += node.textContent + ' ';
    });
    
    return { transcript: transcript.trim() };
}
"""

print(f"Starting transcript extraction for {len(videos)} videos...")
print("This will use OpenClaw's browser tool to bypass YouTube's bot detection.\n")

# Save the JS extraction function for use with browser tool
js_file = f"{OUTPUT_DIR}/../extract_transcript.js"
with open(js_file, 'w') as f:
    f.write(EXTRACT_TRANSCRIPT_JS)

print(f"✓ Extraction script saved to {js_file}")
print("\nInstructions:")
print("1. Use the OpenClaw browser tool to open each video")
print("2. Run the extraction JS to get transcripts")
print("3. Save to individual files")
print("\nThis script will generate the commands needed. Run them with the browser tool.")
print("\n" + "="*80 + "\n")

# Generate browser tool commands
for video_id, title in videos:
    url = f"https://www.youtube.com/watch?v={video_id}"
    output_file = f"{OUTPUT_DIR}/{video_id}.txt"
    
    print(f"# {title}")
    print(f"# browser.open('{url}')")
    print(f"# result = browser.evaluate(open('{js_file}').read())")
    print(f"# save result['transcript'] to {output_file}")
    print()

print("\n" + "="*80)
print("ALTERNATIVE: Use unbrowse_capture to reverse-engineer YouTube's transcript API")
print("This is more efficient for bulk operations.")
