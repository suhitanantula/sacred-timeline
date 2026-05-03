#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
DEMO_DIR="$ROOT_DIR/docs/marketing/demo"
FRAME_DIR="$DEMO_DIR/frames"
OUTPUT_DIR="$DEMO_DIR/output"
STORYBOARD="$DEMO_DIR/storyboard.html"
VOICEOVER="$DEMO_DIR/voiceover.txt"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
FFMPEG="${FFMPEG:-ffmpeg}"
FFPROBE="${FFPROBE:-ffprobe}"
SAY="${SAY:-say}"
SLIDE_DURATION="7.5"
SLIDE_COUNT="12"
WIDTH="1920"
HEIGHT="1080"
VIDEO_SECONDS="90"

mkdir -p "$FRAME_DIR" "$OUTPUT_DIR"
rm -f "$FRAME_DIR"/scene-*.png
rm -f "$OUTPUT_DIR"/frames.txt

for index in $(seq 0 $((SLIDE_COUNT - 1))); do
  frame_number=$(printf "%02d" "$index")
  "$CHROME" \
    --headless=new \
    --disable-gpu \
    --hide-scrollbars \
    --window-size="$WIDTH,$HEIGHT" \
    --screenshot="$FRAME_DIR/scene-$frame_number.png" \
    "file://$STORYBOARD?slide=$index" >/dev/null 2>&1
done

for index in $(seq 0 $((SLIDE_COUNT - 1))); do
  frame_number=$(printf "%02d" "$index")
  printf "file '%s/scene-%s.png'\n" "$FRAME_DIR" "$frame_number" >> "$OUTPUT_DIR/frames.txt"
  printf "duration %s\n" "$SLIDE_DURATION" >> "$OUTPUT_DIR/frames.txt"
done
printf "file '%s/scene-%02d.png'\n" "$FRAME_DIR" $((SLIDE_COUNT - 1)) >> "$OUTPUT_DIR/frames.txt"

"$FFMPEG" -y \
  -f concat \
  -safe 0 \
  -i "$OUTPUT_DIR/frames.txt" \
  -vf "fps=30,format=yuv420p" \
  -c:v libx264 \
  -preset veryfast \
  -crf 20 \
  "$OUTPUT_DIR/sacred-timeline-demo-silent.mp4"

"$SAY" -v Daniel -r 170 -o "$OUTPUT_DIR/voiceover.aiff" -f "$VOICEOVER"

"$FFMPEG" -y \
  -i "$OUTPUT_DIR/sacred-timeline-demo-silent.mp4" \
  -i "$OUTPUT_DIR/voiceover.aiff" \
  -filter_complex "[1:a]apad,atrim=0:${VIDEO_SECONDS},afade=t=out:st=87:d=3[a]" \
  -t "$VIDEO_SECONDS" \
  -map 0:v \
  -map "[a]" \
  -c:v copy \
  -c:a aac \
  -b:a 160k \
  -movflags +faststart \
  "$OUTPUT_DIR/sacred-timeline-90-second-demo.mp4"

"$FFMPEG" -y \
  -i "$OUTPUT_DIR/sacred-timeline-90-second-demo.mp4" \
  -vf "fps=1/7.5,scale=480:-1,tile=4x3" \
  -frames:v 1 \
  -update 1 \
  "$OUTPUT_DIR/contact-sheet.jpg"

"$FFPROBE" -v error \
  -show_entries format=duration,size \
  -of default=noprint_wrappers=1 \
  "$OUTPUT_DIR/sacred-timeline-90-second-demo.mp4"
