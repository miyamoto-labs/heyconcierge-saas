import subprocess
import os

# Directory to save transcripts
output_dir = "/Users/erik/.openclaw/workspace/research/albert_olgaard/transcripts"
os.makedirs(output_dir, exist_ok=True)

# Video IDs and Titles
videos = [
    ("G3J-H7bnYSg", "How I'd start an AI Agency in 2026 (3 HOURS Course)"),
    ("Z7qTuS11vI4", "STOP selling AI agents. Do this instead..."),
    # Add the rest of the video IDs and titles here
]

# Full path to yt-dlp
yt_dlp_path = "/Users/erik/Library/Python/3.9/bin/yt-dlp"

for video_id, title in videos:
    output_file = os.path.join(output_dir, f"{video_id}.txt")
    command = [
        yt_dlp_path,
        "--skip-download",
        "--write-sub",
        "--sub-lang", "en",
        "--output", output_file,
        f"https://www.youtube.com/watch?v={video_id}"
    ]
    try:
        subprocess.run(command, check=True)
        print(f"Successfully fetched transcript for: {title}")
    except subprocess.CalledProcessError as e:
        print(f"Failed to fetch transcript for {title}: {e}")