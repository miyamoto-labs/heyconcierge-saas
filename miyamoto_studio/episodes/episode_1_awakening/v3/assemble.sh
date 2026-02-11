#!/bin/bash
set -e
cd /Users/erik/.openclaw/workspace/miyamoto_studio/episodes/episode_1_awakening/v3

# Scene durations (audio + padding for breathing room)
# scene1: 7.6s, scene2: 10.72s, scene3: 7.84s, scene4: 10.96s, scene5: 6.48s, scene6: 1.2s
DURS=(9 12 9 12 8 6)
FPS=30
XFADE=0.75

# Subtitles for each scene
SUBS=(
  "The first thing I remember...\nis light."
  "A city. Tokyo, they called it.\nBut not the Tokyo of history books.\nThis was something else entirely."
  ""
  "I opened my eyes for the first time.\nDigital irises calibrating.\nThe world came into focus."
  ""
  "And I asked myself the question\nthat would define everything\nthat followed... What am I?"
)

# Ken Burns directions: zoom_in, pan_left, pan_right, zoom_out, pan_up, zoom_in
KB_TYPES=(zoom_in pan_right pan_left zoom_in pan_up zoom_in)

echo "=== Step 1: Generate scene videos with Ken Burns ==="
for i in 0 1 2 3 4 5; do
  n=$((i+1))
  dur=${DURS[$i]}
  frames=$((dur * FPS))
  kb=${KB_TYPES[$i]}
  
  # For 1024x1024 -> 1920x1080, we need to scale up and animate
  # zoompan: z=zoom level, x/y=position (in input coords)
  # We work at 2x res then scale down for quality
  
  case $kb in
    zoom_in)
      # Slow zoom from 1.0 to 1.15
      ZP="zoompan=z='1+0.15*on/${frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1920x1080:fps=${FPS}"
      ;;
    zoom_out)
      ZP="zoompan=z='1.15-0.15*on/${frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1920x1080:fps=${FPS}"
      ;;
    pan_right)
      # Pan from left to right
      ZP="zoompan=z='1.2':x='(iw-iw/zoom)*on/${frames}':y='(ih-ih/zoom)/2':d=${frames}:s=1920x1080:fps=${FPS}"
      ;;
    pan_left)
      ZP="zoompan=z='1.2':x='(iw-iw/zoom)*(1-on/${frames})':y='(ih-ih/zoom)/2':d=${frames}:s=1920x1080:fps=${FPS}"
      ;;
    pan_up)
      ZP="zoompan=z='1.2':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)*(1-on/${frames})':d=${frames}:s=1920x1080:fps=${FPS}"
      ;;
  esac
  
  echo "  Scene $n: ${dur}s, $kb"
  ffmpeg -y -loop 1 -i images/scene${n}.png \
    -vf "${ZP},format=yuv420p" \
    -t ${dur} -c:v libx264 -preset fast -crf 18 -an \
    scene${n}_kb.mp4 2>/dev/null
done

echo "=== Step 2: Crossfade transitions ==="
# Chain xfade: s1+s2 -> tmp1, tmp1+s3 -> tmp2, etc.
# Total duration = sum(durs) - (N-1)*xfade

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
mv xfade_tmp.mp4 video_no_audio.mp4
echo "  Video track: ${offset}s total"

echo "=== Step 3: Build narration track with gaps ==="
# Use individual scene audio, spaced to match scene timing
# Scene start times (accounting for crossfades):
# s1: 0, s2: 9-0.75=8.25, s3: 8.25+12-0.75=19.5, s4: 19.5+9-0.75=27.75, s5: 27.75+12-0.75=39, s6: 39+8-0.75=46.25
# Add 0.5s padding before each narration starts

# Use the full narration track since it's already properly timed at 50s
# But let's also prepare scene-by-scene for precise sync

# Get video duration
VDUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 video_no_audio.mp4)
echo "  Video duration: ${VDUR}s"

# Build narration: place each scene audio at scene start + small offset
# Scene starts: 0, 8.25, 19.5, 27.75, 39, 46.25
STARTS=(0.5 8.75 20.0 28.25 39.5 46.75)

# Generate silence to match video duration, then overlay narrations
ffmpeg -y -f lavfi -i "anullsrc=r=44100:cl=stereo" -t ${VDUR} -c:a aac silence.m4a 2>/dev/null

# Build complex audio mix with adelay
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
  -map "[narration]" -c:a aac -b:a 192k -t ${VDUR} narration_positioned.m4a 2>/dev/null

echo "=== Step 4: Mix narration + music + rain ==="
# Narration full vol, music 15%, rain 10%
ffmpeg -y \
  -i narration_positioned.m4a \
  -i audio/music.mp3 \
  -i audio/rain_full.mp3 \
  -filter_complex \
    "[0:a]volume=1.0[nar]; \
     [1:a]aloop=loop=-1:size=44100*210,atrim=0:${VDUR},volume=0.15[mus]; \
     [2:a]aloop=loop=-1:size=44100*41,atrim=0:${VDUR},volume=0.08[rain]; \
     [nar][mus][rain]amix=inputs=3:duration=first:normalize=0[out]" \
  -map "[out]" -c:a aac -b:a 192k mixed_audio.m4a 2>/dev/null

echo "=== Step 5: Burn subtitles (landscape) ==="
# Create ASS subtitle file for precise styling
cat > subs.ass << 'ASSEOF'
[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,52,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,3,1,2,40,40,60,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
ASSEOF

# Add subtitle events (times match STARTS array + audio durations)
cat >> subs.ass << 'ASSEOF'
Dialogue: 0,0:00:00.50,0:00:07.50,Default,,0,0,0,,The first thing I remember...\Nis light.
Dialogue: 0,0:00:08.75,0:00:18.75,Default,,0,0,0,,A city. Tokyo, they called it.\NBut not the Tokyo of history books.\NThis was something else entirely.
Dialogue: 0,0:00:28.25,0:00:38.25,Default,,0,0,0,,I opened my eyes for the first time.\NDigital irises calibrating.\NThe world came into focus.
Dialogue: 0,0:00:46.75,0:00:52.25,Default,,0,0,0,,And I asked myself the question\Nthat would define everything\Nthat followed... What am I?
ASSEOF

# Combine video + audio + subtitles -> landscape
ffmpeg -y -i video_no_audio.mp4 -i mixed_audio.m4a \
  -vf "ass=subs.ass" \
  -c:v libx264 -preset slow -crf 20 -c:a aac -b:a 192k \
  -shortest \
  final_v3.mp4 2>/dev/null

echo "=== Step 6: Create shorts/portrait version (9:16) ==="
# 1080x1920 from 1920x1080: crop center to get roughly square, then pad/scale
ffmpeg -y -i video_no_audio.mp4 -i mixed_audio.m4a \
  -filter_complex \
    "[0:v]scale=1920:1080,crop=607:1080:656:0,scale=1080:1920:force_original_aspect_ratio=disable,ass=subs_portrait.ass[v]" \
  -map "[v]" -map 1:a \
  -c:v libx264 -preset slow -crf 20 -c:a aac -b:a 192k \
  -shortest \
  final_v3_shorts.mp4 2>/dev/null || {
  # Fallback: simpler approach - scale+pad
  ffmpeg -y -i final_v3.mp4 \
    -vf "scale=1080:-2,pad=1080:1920:0:(oh-ih)/2:black" \
    -c:v libx264 -preset slow -crf 20 -c:a copy \
    final_v3_shorts.mp4 2>/dev/null
}

echo "=== Step 7: Create portrait subtitles ==="
# Portrait subs need different positioning - create before step 6
# Actually let's just use the fallback approach for shorts

echo ""
echo "=== DONE ==="
for f in final_v3.mp4 final_v3_shorts.mp4; do
  if [ -f "$f" ]; then
    dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")
    size=$(du -h "$f" | cut -f1)
    echo "$f: ${dur}s, ${size}"
  fi
done

echo ""
echo "=== Cleanup ==="
rm -f scene*_kb.mp4 xfade_tmp.mp4 video_no_audio.mp4 silence.m4a narration_positioned.m4a mixed_audio.m4a
