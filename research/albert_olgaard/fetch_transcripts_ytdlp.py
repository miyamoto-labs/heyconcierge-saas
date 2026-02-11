import subprocess
import os

# Directory to save transcripts
output_dir = "/Users/erik/.openclaw/workspace/research/albert_olgaard/transcripts"
os.makedirs(output_dir, exist_ok=True)

# Video IDs and Titles
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

# Full path to yt-dlp
yt_dlp_path = "/Users/erik/Library/Python/3.9/bin/yt-dlp"

for video_id, title in videos:
    output_file = os.path.join(output_dir, f"{video_id}.txt")
    command = [
        yt_dlp_path,
        "--skip-download",
        "--write-auto-sub",
        "--sub-lang", "en",
        "--output", output_file,
        f"https://www.youtube.com/watch?v={video_id}"
    ]
    try:
        subprocess.run(command, check=True)
        print(f"Successfully fetched transcript for: {title}")
    except subprocess.CalledProcessError as e:
        print(f"Failed to fetch transcript for {title}: {e}")