#!/bin/bash
set -e
cd /Users/erik/.openclaw/workspace/miyamoto_studio/episodes/episode_1_awakening/v3

# Scene timing: start times for subtitles (matching narration placement)
# s1: 0.5-7.5, s2: 8.75-18.75, s4: 28.25-38.25, s6: 46.75-52.25
# Scene 3 and 5 have no subtitles

echo "=== Overlaying subtitles onto video ==="
# Use overlay filter with enable expressions for timed subtitle display
ffmpeg -y \
  -i video_no_audio.mp4 \
  -i subs_overlay/scene1.png \
  -i subs_overlay/scene2.png \
  -i subs_overlay/scene4.png \
  -i subs_overlay/scene6.png \
  -filter_complex \
    "[0:v][1:v]overlay=0:0:enable='between(t,0.5,7.5)'[v1]; \
     [v1][2:v]overlay=0:0:enable='between(t,8.75,18.75)'[v2]; \
     [v2][3:v]overlay=0:0:enable='between(t,28.25,38.25)'[v3]; \
     [v3][4:v]overlay=0:0:enable='between(t,46.75,52.25)'[vout]" \
  -map "[vout]" -c:v libx264 -preset slow -crf 20 -an \
  video_with_subs.mp4

echo "=== Adding mixed audio (landscape) ==="
ffmpeg -y \
  -i video_with_subs.mp4 -i mixed_audio.m4a \
  -c:v copy -c:a aac -b:a 192k -shortest \
  final_v3.mp4

echo "=== Creating shorts version (9:16) ==="
# Scale to fill 1080 width, center crop vertically
ffmpeg -y \
  -i final_v3.mp4 \
  -vf "scale=-2:1920,crop=1080:1920:(iw-1080)/2:0" \
  -c:v libx264 -preset slow -crf 20 -c:a copy \
  final_v3_shorts.mp4

echo ""
echo "=== RESULTS ==="
for f in final_v3.mp4 final_v3_shorts.mp4; do
  if [ -f "$f" ]; then
    dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")
    size=$(du -h "$f" | cut -f1)
    echo "  $f: ${dur}s, ${size}"
  fi
done

echo ""
echo "=== Cleanup ==="
rm -f scene*_kb.mp4 video_no_audio.mp4 video_with_subs.mp4 silence.m4a narration_positioned.m4a mixed_audio.m4a
