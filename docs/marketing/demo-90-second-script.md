# Sacred Timeline 90-Second Demo Script

## Demo Promise

Show one thing clearly:

> Sacred Timeline lets people build with AI agents without losing the working version, the story, or the ability to recover.

Rendered assets:

- Final video: [demo/output/sacred-timeline-90-second-demo.mp4](demo/output/sacred-timeline-90-second-demo.mp4)
- Contact sheet: [demo/output/contact-sheet.jpg](demo/output/contact-sheet.jpg)
- Storyboard source: [demo/storyboard.html](demo/storyboard.html)
- Voiceover source: [demo/voiceover.txt](demo/voiceover.txt)
- Render script: [demo/render-demo.sh](demo/render-demo.sh)

## Audience

- AI-native consultants, strategists, and operators
- Vibe coders using Codex, Claude Code, Cursor, Lovable, Bolt, Replit, or v0
- Founders building internal tools with agents
- Agencies producing client assets with AI-generated code or documents

## Setup

- Open a small project folder with visible files.
- Have Codex or Claude Code open beside the terminal.
- Make sure Sacred Timeline is installed.
- Start from a clean or lightly changed repo.

## Script

### 0:00-0:10 - The Problem

Voiceover:

> You do not start by thinking you need version control. You start with a simpler problem: an AI agent just changed your project, and now you are not sure what changed, what still works, or whether you can safely try another direction.

> The thing that solves this is git. Git gives you history, rollback, safe branches, and cloud backup. But if you are a vibe coder, consultant, founder, writer, or knowledge worker, git can feel like a foreign language. Sacred Timeline is for you. It gives you the approach and language to work with git without the confusion.

Screen:

- Show the project folder.
- Show the agent about to make changes.

### 0:10-0:25 - The Bridge and Safety Check

Action:

```bash
sacred doctor
sacred status
```

Voiceover:

> Sacred Timeline is the safety layer before the agent starts working. It checks whether this folder is protected, whether cloud backup is connected, and whether the current version is clean.

Screen moment:

- Point to "On main timeline" and "No uncommitted changes" if clean.
- If not clean, point to the changed-file summary.

### 0:25-0:45 - Capture a Working Moment

Action:

Ask the agent to make a small visible change, then run:

```bash
sacred changes
sacred capture "improve the proposal landing page"
```

Voiceover:

> When the agent makes useful progress, I capture the moment in plain English. I do not need to understand the machinery underneath. I just need to know the work is protected.

Screen moment:

- Show `sacred changes`.
- Show the successful capture.

### 0:45-1:05 - Try Something Risky

Action:

```bash
sacred experiment "bolder-homepage"
```

Ask the agent to make a more dramatic change.

Voiceover:

> Now I can try a bold direction without risking the working version. Sacred Timeline calls this an experiment. If it works, I keep it. If it does not, I discard it.

Screen moment:

- Show the branch/experiment message.
- Show the agent making the risky change.

### 1:05-1:20 - Keep or Discard

Option A:

```bash
sacred keep
```

Voiceover:

> This version works, so I keep the experiment. It becomes part of the main timeline.

Option B:

```bash
sacred discard
```

Voiceover:

> This version is not right, so I discard it. The original working version is still safe.

### 1:20-1:30 - Tell the Story and Backup

Action:

```bash
sacred narrate 7
sacred backup
```

Voiceover:

> At the end, Sacred Timeline tells the story of what happened and backs it up to the cloud. It is an undo button, project memory, and safety system for AI-built work.

Final line:

> Sacred Timeline: the power of git, in the language of ordinary work.

## On-Screen Captions

- "Before AI changes anything: check the timeline."
- "Capture useful progress in plain English."
- "Try risky changes safely."
- "Keep what works. Discard what does not."
- "Back up the story to cloud."

## Short Social Cut

> AI agents move fast. Sacred Timeline gives you checkpoints, experiments, rollback, backup, and a plain-English story of what changed. It is the safety layer for people building with AI.
