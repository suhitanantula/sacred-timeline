# Sacred Timeline Marketing Kit

Use these assets to market Sacred Timeline without forcing people to care about git before they feel the pain.

## Core Message

> Sacred Timeline is the safety layer for AI-built work.

## Primary Wedge

Target people already letting AI agents touch real work:

- AI-native consultants and strategists
- founders and operators building internal tools
- vibe coders using Codex, Claude Code, Cursor, Lovable, Bolt, Replit, or v0
- agencies managing AI-generated client work
- writers and researchers iterating with agents

## Assets

- [90-second demo script](demo-90-second-script.md)
- [Rendered 90-second demo video](demo/output/sacred-timeline-90-second-demo.mp4)
- [Demo storyboard source](demo/storyboard.html)
- [Demo voiceover script](demo/voiceover.txt)
- [Demo render script](demo/render-demo.sh)
- [Starter prompts](starter-prompts.md)
- [Landing page copy](landing-page.md)

## Voiceover Rendering

The demo renderer supports three voiceover paths:

```bash
# Best default when an OpenAI key is available
OPENAI_API_KEY=... AUDIO_PROVIDER=openai ./docs/marketing/demo/render-demo.sh

# ElevenLabs option when a voice ID is available
ELEVENLABS_API_KEY=... ELEVENLABS_VOICE_ID=... AUDIO_PROVIDER=elevenlabs ./docs/marketing/demo/render-demo.sh

# Local fallback
AUDIO_PROVIDER=say ./docs/marketing/demo/render-demo.sh
```

When using AI-generated voiceover, disclose that the narration is AI-generated wherever the video is published.

## Best First CTA

> Before this AI agent changes anything, protect the project with Sacred Timeline.

## Avoid Leading With

- "Git for non-developers"
- "Version control"
- "Branching and commits"

Those are true, but they are not the buyer pain.

## Lead With

- "Never lose AI-generated work again."
- "Try bold changes without breaking the working version."
- "Give your coding agent checkpoints, rollback, backup, and memory."
- "Build with AI without losing the plot."
