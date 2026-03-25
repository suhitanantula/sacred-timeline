# Sacred Timeline — AI-Native Git Layer Design

**Date:** 2026-03-25
**Status:** Approved
**Author:** Suhit Anantula

---

## Vision

Sacred Timeline becomes the git layer for the AI-native world.

In the AI age, everything is iterative and experimental — code, strategy, writing, research. The git concepts that developers have always used (safe experiments, rollback, capture moments, merge what works) are universal mental models, not just dev tools. Sacred Timeline is the human interface for that universal need.

**The core promise:** Sacred Timeline doesn't replace git — it makes git invisible. Whether you're a vibe coder, a strategist writing docs, or a senior developer — you interact with the same human vocabulary. The git machinery runs silently underneath.

---

## The Problem

1. **Git is invisible and hard.** Most people don't know it exists. When they do, it requires training — a multi-million dollar industry of consultants, courses, and onboarding programs.

2. **AI-native work is everything now.** Strategy, code, writing, research — all of it is now built iteratively with AI. Everyone needs experiments, rollback, and safe exploration. Not just developers.

3. **AI tools generate changes humans can't track.** Claude Code, OpenClaw, and other AI coding tools make dozens of commits in a session. Users don't understand what happened. There's no narrative.

4. **No git tool speaks human.** Every existing tool — GitHub Desktop, GitKraken, Tower — is built for developers who already understand git concepts. Nobody is building for the person who doesn't know what a commit is.

---

## Target Audience

| User | Need |
|------|------|
| Vibe coders | Use AI to build without knowing git exists |
| Claude Code / OpenClaw users | Understand what the AI did, roll back safely |
| Knowledge workers (strategists, writers, researchers) | Experiment with ideas, capture milestones, collaborate |
| Developers | Everything above + power when they need it |

---

## Architecture

Three surfaces, one coherent experience:

```
┌─────────────────────────────────────────────────────┐
│                  Sacred Timeline                     │
├──────────────┬──────────────────┬───────────────────┤
│ Claude Code  │       CLI        │     Web App       │
│   Skill      │  (already built) │   (dashboard)     │
│              │                  │                   │
│ Auto-capture │ sacred capture   │ Visual timeline   │
│ AI narrate   │ sacred narrate   │ All your projects │
│ Experiments  │ sacred experiment│ Team experiments  │
│ Session wrap │ sacred timeline  │ AI story of work  │
└──────────────┴──────────────────┴───────────────────┘
              All backed by git underneath
```

---

## Section 1 — LLM Integration (The Core Differentiator)

This is the moat. No existing git tool does this.

`narrate` becomes an AI that understands your work — not a commit counter.

**How it works:**
```
sacred narrate
  → reads git diff + commit messages
  → sends to LLM (Claude API)
  → returns plain English story of what happened
  → optionally: what changed, why it matters, what to try next
```

**Three narration modes:**

| Mode | What it does | Who it's for |
|------|-------------|--------------|
| `narrate` | Story of your last session | Vibe coders, writers |
| `narrate 7` | Story of the last week | Everyone |
| `narrate <hash>` | Explain this one change | Devs reviewing AI work |

**Visualization in web app:** The timeline becomes a living story — not just `○ fix: auth bug` but a coherent narrative of what was built, what was tried and discarded, and what succeeded.

**Implementation:** Claude API (`claude-sonnet-4-6`). Diff + commit messages sent as context. Response formatted as narrative prose with optional structured sections (most active files, experiments tried, key decisions).

---

## Section 2 — Claude Code Skill Integration

A Sacred Timeline skill that makes Sacred Timeline the default git interface for every AI coding session.

**Session lifecycle hooks:**

```
Session starts
  → sacred status (show current state in human language)
  → if risky task detected: suggest starting an experiment

During session (after significant file edits)
  → auto-stage changes
  → sacred capture with AI-generated message

Session ends (Stop hook)
  → sacred capture "session wrap: <AI summary of what was built>"
  → sacred narrate (brief story of the session)
  → prompt: "You have X captures to backup — run sacred backup to sync"
```

**Vocabulary training:** The skill trains Claude to always use sacred language:
- Never "commit" → "capture"
- Never "branch" → "experiment"
- Never "push" → "backup"
- Explains what it's doing in human terms before doing it

**Claude Code `settings.json` hooks:**
```json
{
  "hooks": {
    "Stop": "sacred capture --auto && sacred narrate --brief",
    "PostToolUse": "sacred status-line"
  }
}
```

---

## Section 3 — Dev Mode (Layered Power)

Sacred Timeline serves both non-coders and developers without compromising either.

**Default (everyone):** Sacred only
```
📸 Capturing your work...
✓ Captured: "rebuilt the login flow"
```

**Dev mode (opt-in):** Sacred + git side by side
```
📸 Capturing your work...
✓ Captured: "rebuilt the login flow"
  ↳ git add -A && git commit -m "rebuilt the login flow"
```

**Enable with:**
```bash
sacred config --show-git
```

Dev mode also functions as a teaching tool — vibe coders who grow in confidence can gradually peek behind the curtain when they're ready. Teams onboarding to git can use it as a live translation layer.

---

## Section 4 — Web App

The "home" for your Sacred Timeline across all projects.

**Core screens:**

```
┌─────────────────────────────────────────────────────┐
│  Sacred Timeline  [Projects ▾]    [Backup All]      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ethnobot          Siftly         strategy-q2       │
│  ● active today    3 days ago     1 week ago        │
│  "rebuilt intake   "fixed article  "revised go-to-  │
│   flow + sponsor    previews"       market section" │
│   onboarding"                                       │
│                                                     │
├─────────────────────────────────────────────────────┤
│  📖 Your week:                                      │
│  You shipped 3 big things this week across 2        │
│  projects. Most of the work was on ethnobot —       │
│  you rebuilt the sponsor intake flow and added      │
│  cultural intelligence. Siftly got a security       │
│  fix. One experiment still running: "new-auth".     │
└─────────────────────────────────────────────────────┘
```

**Key features:**

| Feature | What it does |
|---|---|
| Cross-project timeline | All your work in one place, not per-repo |
| AI weekly story | "Here's what you built this week" — across everything |
| Experiment tracker | All open branches across all projects in one view |
| One-click backup | Push all projects with unpushed captures at once |
| Share a timeline | Read-only link — "here's what I built this week" |
| Team view | See teammates' timelines, merge experiments together |

**Tech stack:** Next.js, GitHub OAuth or local git path, Claude API for narration. Start local-first (read repos on machine), add cloud sync in v2.

**Business model:** Teams buying Sacred Timeline web app instead of git training consultants. The "git onboarding" budget is the market.

---

## Implementation Phases

**Phase 1 — Claude Code Skill (ship fast)**
- Sacred Timeline skill file for Claude Code
- Auto-capture hook on session Stop
- AI-powered `sacred narrate` using Claude API
- `sacred config --show-git` dev mode toggle

**Phase 2 — CLI Upgrade**
- Real LLM narration replacing the current commit-counting stub
- `sacred narrate <hash>` for explaining individual changes
- Auto-generated capture messages from diff

**Phase 3 — Web App**
- Local-first dashboard reading git repos
- Cross-project timeline view
- AI weekly story
- GitHub OAuth for cloud sync

**Phase 4 — Expand**
- OpenClaw / Cline integration
- Obsidian plugin upgrade with narration
- Team features
- Mobile companion

---

## What Makes This Different

Every other git tool assumes you understand git. Sacred Timeline assumes you don't — and then gives power users everything they need anyway. The LLM narration layer is the moat: no other tool can tell you the story of what you built, in plain English, across all your projects.

Git is infrastructure. Sacred Timeline is the human experience on top of it.
