#!/usr/bin/env python3
"""Generate transparent subtitle PNG overlays for each scene."""
from PIL import Image, ImageDraw, ImageFont
import os

os.chdir("/Users/erik/.openclaw/workspace/miyamoto_studio/episodes/episode_1_awakening/v3")

W, H = 1920, 1080
SUBS = {
    1: "The first thing I remember...\nis light.",
    2: "A city. Tokyo, they called it.\nBut not the Tokyo of history books.\nThis was something else entirely.",
    3: None,  # atmospheric, no text
    4: "I opened my eyes for the first time.\nDigital irises calibrating.\nThe world came into focus.",
    5: None,  # visual scene
    6: "And I asked myself the question\nthat would define everything\nthat followed... What am I?",
}

# Try to find a good font
font_paths = [
    "/System/Library/Fonts/Helvetica.ttc",
    "/System/Library/Fonts/SFNSText.ttf", 
    "/System/Library/Fonts/SFNS.ttf",
    "/Library/Fonts/Arial.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
]
font = None
for fp in font_paths:
    try:
        font = ImageFont.truetype(fp, 48)
        print(f"Using font: {fp}")
        break
    except:
        continue
if font is None:
    font = ImageFont.load_default()
    print("Using default font")

os.makedirs("subs_overlay", exist_ok=True)

for scene, text in SUBS.items():
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    if text:
        draw = ImageDraw.Draw(img)
        lines = text.split("\n")
        # Calculate total text height
        line_heights = []
        line_widths = []
        for line in lines:
            bbox = draw.textbbox((0, 0), line, font=font)
            line_heights.append(bbox[3] - bbox[1])
            line_widths.append(bbox[2] - bbox[0])
        
        total_h = sum(line_heights) + (len(lines) - 1) * 12
        y_start = H - 120 - total_h  # lower third
        
        for i, line in enumerate(lines):
            x = (W - line_widths[i]) // 2
            y = y_start + sum(line_heights[:i]) + i * 12
            # Draw outline (shadow)
            for dx in range(-3, 4):
                for dy in range(-3, 4):
                    if dx*dx + dy*dy <= 9:
                        draw.text((x+dx, y+dy), line, font=font, fill=(0, 0, 0, 220))
            # Draw text
            draw.text((x, y), line, font=font, fill=(255, 255, 255, 255))
    
    img.save(f"subs_overlay/scene{scene}.png")
    print(f"Scene {scene}: {'subtitle' if text else 'blank'}")

print("Done generating subtitle overlays")
