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
    print(f"Running command: {' '.join(command)}")
    try:
        result = subprocess.run(command, check=True, capture_output=True, text=True)
        print(f"Command output: {result.stdout}")
        print(f"Command error: {result.stderr}")
        if os.path.exists(output_file + ".en.vtt"):
            print(f"Transcript saved for: {title}")
        else:
            print(f"No transcript saved for: {title}")
    except subprocess.CalledProcessError as e:
        print(f"Failed to fetch transcript for {title}: {e}")