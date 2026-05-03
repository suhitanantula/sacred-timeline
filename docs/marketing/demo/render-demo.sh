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
AUDIO_PROVIDER="${AUDIO_PROVIDER:-auto}"
OPENAI_TTS_MODEL="${OPENAI_TTS_MODEL:-gpt-4o-mini-tts}"
OPENAI_TTS_VOICE="${OPENAI_TTS_VOICE:-marin}"
ELEVENLABS_MODEL="${ELEVENLABS_MODEL:-eleven_multilingual_v2}"
ELEVENLABS_VOICE_ID="${ELEVENLABS_VOICE_ID:-JBFqnCBsd6RMkjVDRZzb}"
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

VOICE_AUDIO="$OUTPUT_DIR/voiceover.aiff"

if { [ "$AUDIO_PROVIDER" = "openai" ] || [ "$AUDIO_PROVIDER" = "auto" ]; } && [ -n "${OPENAI_API_KEY:-}" ]; then
  VOICE_AUDIO="$OUTPUT_DIR/voiceover-openai.mp3"
  OPENAI_PAYLOAD="$OUTPUT_DIR/openai-speech.json"
  VOICEOVER="$VOICEOVER" OPENAI_PAYLOAD="$OPENAI_PAYLOAD" OPENAI_TTS_MODEL="$OPENAI_TTS_MODEL" OPENAI_TTS_VOICE="$OPENAI_TTS_VOICE" python3 - <<'PY'
import json
import os

with open(os.environ["VOICEOVER"], "r", encoding="utf-8") as f:
    text = f.read().strip()

payload = {
    "model": os.environ["OPENAI_TTS_MODEL"],
    "voice": os.environ["OPENAI_TTS_VOICE"],
    "input": text,
    "instructions": "Warm, confident product narrator. Clear pacing, understated energy, no hype. Sound like a senior operator explaining a useful tool to AI-native consultants and founders.",
    "response_format": "mp3",
}

with open(os.environ["OPENAI_PAYLOAD"], "w", encoding="utf-8") as f:
    json.dump(payload, f)
PY
  curl -fsS https://api.openai.com/v1/audio/speech \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -H "Content-Type: application/json" \
    -d @"$OPENAI_PAYLOAD" \
    --output "$VOICE_AUDIO"
elif { [ "$AUDIO_PROVIDER" = "elevenlabs" ] || [ "$AUDIO_PROVIDER" = "auto" ]; } && { [ -n "${ELEVENLABS_API_KEY:-}" ] || [ -n "${ELEVEN_API_KEY:-}" ]; }; then
  VOICE_AUDIO="$OUTPUT_DIR/voiceover-elevenlabs.mp3"
  ELEVENLABS_PAYLOAD="$OUTPUT_DIR/elevenlabs-speech.json"
  ELEVENLABS_KEY="${ELEVENLABS_API_KEY:-${ELEVEN_API_KEY:-}}"
  VOICEOVER="$VOICEOVER" ELEVENLABS_PAYLOAD="$ELEVENLABS_PAYLOAD" ELEVENLABS_MODEL="$ELEVENLABS_MODEL" python3 - <<'PY'
import json
import os

with open(os.environ["VOICEOVER"], "r", encoding="utf-8") as f:
    text = f.read().strip()

payload = {
    "text": text,
    "model_id": os.environ["ELEVENLABS_MODEL"],
    "voice_settings": {
        "stability": 0.55,
        "similarity_boost": 0.75,
        "style": 0.25,
        "use_speaker_boost": True,
    },
}

with open(os.environ["ELEVENLABS_PAYLOAD"], "w", encoding="utf-8") as f:
    json.dump(payload, f)
PY
  curl -fsS "https://api.elevenlabs.io/v1/text-to-speech/$ELEVENLABS_VOICE_ID?output_format=mp3_44100_128" \
    -H "xi-api-key: $ELEVENLABS_KEY" \
    -H "Content-Type: application/json" \
    -d @"$ELEVENLABS_PAYLOAD" \
    --output "$VOICE_AUDIO"
else
  "$SAY" -v Daniel -r 170 -o "$VOICE_AUDIO" -f "$VOICEOVER"
fi

"$FFMPEG" -y \
  -i "$OUTPUT_DIR/sacred-timeline-demo-silent.mp4" \
  -i "$VOICE_AUDIO" \
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
