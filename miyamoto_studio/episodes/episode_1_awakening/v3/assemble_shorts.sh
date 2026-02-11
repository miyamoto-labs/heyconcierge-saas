#!/bin/bash
set -e
cd /Users/erik/.openclaw/workspace/miyamoto_studio/episodes/episode_1_awakening/v3

DURS=(9 12 9 12 8 6)
FPS=30
XFADE=0.75

echo "=== Step 1: Ken Burns for 9:16 (1080x1920) ==="
# 1024x1024 source -> 1080x1920 portrait. Scale up, animate crop.
KB_TYPES=(zoom_in pan_right pan_left zoom_in pan_up zoom_in)

for i in 0 1 2 3 4 5; do
  n=$((i+1))
  dur=${DURS[$i]}
  frames=$((dur * FPS))
  kb=${KB_TYPES[$i]}

  # zoompan outputs at target size. For 9:16 from square, we need higher zoom to fill width
  # At zoom=1.0 with s=1080x1920, it maps the 1024x1024 input. We need zoom ~1.78 to fill vertically.
  # Actually zoompan scales input to fit output first, so with 1024x1024->1080x1920, 
  # it will letterbox. We want to fill, so we need z >= 1920/1080 = 1.78 base zoom.
  
  case $kb in
    zoom_in)
      ZP="zoompan=z='1.8+0.15*on/${frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1080x1920:fps=${FPS}"
      ;;
    pan_right)
      ZP="zoompan=z='1.9':x='(iw/2-iw/zoom/2)+(iw/zoom*0.08)*on/${frames}':y='ih/2-(ih/zoom/2)':d=${frames}:s=1080x1920:fps=${FPS}"
      ;;
    pan_left)
      ZP="zoompan=z='1.9':x='(iw/2-iw/zoom/2)-(iw/zoom*0.08)*(on/${frames}-1)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1080x1920:fps=${FPS}"
      ;;
    pan_up)
      ZP="zoompan=z='1.9':x='iw/2-(iw/zoom/2)':y='(ih/2-ih/zoom/2)-(ih/zoom*0.08)*(on/${frames}-1)':d=${frames}:s=1080x1920:fps=${FPS}"
      ;;
  esac

  echo "  Scene $n: ${dur}s, $kb"
  ffmpeg -y -loop 1 -i images/scene${n}.png \
    -vf "${ZP},format=yuv420p" \
    -t ${dur} -c:v libx264 -preset fast -crf 18 -an \
    scene${n}_kb.mp4 2>/dev/null
done

echo "=== Step 2: Crossfade transitions ==="
cp scene1_kb.mp4 xfade_tmp.mp4
offset=${DURS[0]}
for i in 1 2 3 4 5; do
  n=$((i+1))
  xfade_offset=$(echo "$offset - $XFADE" | bc)
  echo "  Crossfade at ${xfade_offset}s with scene${n}"
  ffmpeg -y -i xfade_tmp.mp4 -i scene${n}_kb.mp4 \
    -filter_complex "[0:v][1:v]xfade=transition=fade:duration=${XFADE}:offset=${xfade_offset},format=yuv420p" \
    -c:v libx264 -preset fast -crf 18 -an \
    xfade_out.mp4 2>/dev/null
  mv xfade_out.mp4 xfade_tmp.mp4
  offset=$(echo "$offset + ${DURS[$i]} - $XFADE" | bc)
done
mv xfade_tmp.mp4 video_raw.mp4

VDUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 video_raw.mp4)
echo "  Video: ${VDUR}s"

echo "=== Step 3: Narration track ==="
STARTS=(0.5 8.75 20.0 28.25 39.5 46.75)
FILTER=""
for i in 0 1 2 3 4 5; do
  n=$((i+1))
  ms=$(echo "${STARTS[$i]} * 1000" | bc | cut -d. -f1)
  FILTER="${FILTER}[${i}:a]adelay=${ms}|${ms}[s${n}];"
done
FILTER="${FILTER}[s1][s2][s3][s4][s5][s6]amix=inputs=6:duration=longest[narration]"

ffmpeg -y \
  -i audio/scene1.mp3 -i audio/scene2.mp3 -i audio/scene3.mp3 \
  -i audio/scene4.mp3 -i audio/scene5.mp3 -i audio/scene6.mp3 \
  -filter_complex "${FILTER}" \
  -map "[narration]" -c:a aac -b:a 192k -t ${VDUR} narration_pos.m4a 2>/dev/null

echo "=== Step 4: Mix audio ==="
ffmpeg -y \
  -i narration_pos.m4a \
  -i audio/music.mp3 \
  -i audio/rain_full.mp3 \
  -filter_complex \
    "[0:a]volume=1.0[nar]; \
     [1:a]aloop=loop=-1:size=44100*210,atrim=0:${VDUR},volume=0.15[mus]; \
     [2:a]aloop=loop=-1:size=44100*41,atrim=0:${VDUR},volume=0.08[rain]; \
     [nar][mus][rain]amix=inputs=3:duration=first:normalize=0[out]" \
  -map "[out]" -c:a aac -b:a 192k mixed.m4a 2>/dev/null

echo "=== Step 5: Generate portrait subtitle overlays ==="
python3 - << 'PYEOF'
from PIL import Image, ImageDraw, ImageFont
import os
os.chdir("/Users/erik/.openclaw/workspace/miyamoto_studio/episodes/episode_1_awakening/v3")
W, H = 1080, 1920
SUBS = {
    1: "The first thing I remember...\nis light.",
    2: "A city. Tokyo, they called it.\nBut not the Tokyo of history books.\nThis was something else entirely.",
    4: "I opened my eyes for the first time.\nDigital irises calibrating.\nThe world came into focus.",
    6: "And I asked myself the question\nthat would define everything\nthat followed... What am I?",
}
font_paths = ["/System/Library/Fonts/Helvetica.ttc", "/System/Library/Fonts/Supplemental/Arial Bold.ttf"]
font = None
for fp in font_paths:
    try:
        font = ImageFont.truetype(fp, 44)
        break
    except: pass
if not font: font = ImageFont.load_default()
os.makedirs("subs_portrait", exist_ok=True)
for scene in range(1, 7):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    text = SUBS.get(scene)
    if text:
        draw = ImageDraw.Draw(img)
        lines = text.split("\n")
        bboxes = [draw.textbbox((0,0), l, font=font) for l in lines]
        lh = [b[3]-b[1] for b in bboxes]
        lw = [b[2]-b[0] for b in bboxes]
        total_h = sum(lh) + (len(lines)-1)*10
        y_start = H - 200 - total_h
        for j, line in enumerate(lines):
            x = (W - lw[j]) // 2
            y = y_start + sum(lh[:j]) + j*10
            for dx in range(-3, 4):
                for dy in range(-3, 4):
                    if dx*dx + dy*dy <= 9:
                        draw.text((x+dx, y+dy), line, font=font, fill=(0,0,0,220))
            draw.text((x, y), line, font=font, fill=(255,255,255,255))
    img.save(f"subs_portrait/scene{scene}.png")
PYEOF

echo "=== Step 6: Overlay subtitles + mux audio ==="
ffmpeg -y \
  -i video_raw.mp4 \
  -i subs_portrait/scene1.png \
  -i subs_portrait/scene2.png \
  -i subs_portrait/scene4.png \
  -i subs_portrait/scene6.png \
  -i mixed.m4a \
  -filter_complex \
    "[0:v][1:v]overlay=0:0:enable='between(t,0.5,7.5)'[v1]; \
     [v1][2:v]overlay=0:0:enable='between(t,8.75,18.75)'[v2]; \
     [v2][3:v]overlay=0:0:enable='between(t,28.25,38.25)'[v3]; \
     [v3][4:v]overlay=0:0:enable='between(t,46.75,52.25)'[vout]" \
  -map "[vout]" -map 5:a \
  -c:v libx264 -preset slow -crf 20 -c:a aac -b:a 192k -shortest \
  final_v3_shorts.mp4

echo ""
echo "=== RESULT ==="
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 final_v3_shorts.mp4)
size=$(du -h final_v3_shorts.mp4 | cut -f1)
res=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 final_v3_shorts.mp4)
echo "  final_v3_shorts.mp4: ${dur}s, ${size}, ${res}"

# Cleanup
rm -f scene*_kb.mp4 video_raw.mp4 narration_pos.m4a mixed.m4a
echo "  Cleaned up temp files."
