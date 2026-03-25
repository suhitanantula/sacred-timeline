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
│ Claude Code  │       CLI        │  Desktop App      │
│   Skill      │                  │  (Tauri+Next.js)  │
│              │ sacred capture   │                   │
│ Auto-capture │ sacred capture   │ Visual timeline   │
│  (--auto)    │   --auto         │ All your projects │
│ AI narrate   │ sacred narrate   │ AI weekly story   │
│  (--brief)   │   --brief        │ Experiment tracker│
│ Experiments  │ sacred experiment│ Team view         │
│ Session wrap │ sacred config    │                   │
│              │ sacred register  │                   │
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

**API Configuration:** Users provide their Claude API key once via `sacred config --api-key <key>`. The key is stored in `~/.sacred/config.json` (not in the repo). On first run of any narrate command, Sacred Timeline prompts for the key if absent. If the key is missing or invalid, narrate falls back to the current commit-counting summary with a clear message: "Add your Claude API key to unlock AI narration: `sacred config --api-key <key>`".

**Note:** `narrate <hash>` requires a new argument parsing path in the CLI (Phase 2). The current CLI parses the narrate argument as an integer; a hash requires a separate branch to detect and handle. This is a non-breaking addition — `narrate 7` continues to work unchanged.

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

**Vocabulary guidance:** The skill file includes system prompt instructions telling Claude to use sacred language consistently — "capture" not "commit", "experiment" not "branch", "backup" not "push". LLMs are not perfectly consistent at this across long sessions; the instructions reduce drift but do not eliminate it. This is a best-effort UX improvement, not a strict guarantee.

**Claude Code `settings.json` hooks (requires Phase 1 CLI additions):**
```json
{
  "hooks": {
    "Stop": "sacred capture --auto && sacred narrate --brief",
    "PostToolUse": "sacred status-line"
  }
}
```

**Phase 1 CLI additions required before hooks work:**
- `sacred capture --auto` — stages all changes and generates a commit message from the diff using Claude API (no message argument required when flag is present). Fallback when API key is absent or call fails: use a timestamped default message ("session capture: YYYY-MM-DD HH:MM") with a warning, matching the narrate fallback pattern
- `sacred narrate --brief` — runs narration but outputs a 2-3 sentence summary instead of full prose (requires LLM narration from Phase 1)

These flags must ship as part of Phase 1 before the hooks are usable. The skill file should not be published until both flags are implemented.

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

**Deployment model:** Phase 3 ships as a **local-first desktop app** (Tauri or Electron wrapper around Next.js). The app runs on the user's machine and reads git repos from disk directly — no cloud required, no repo registration step. A `~/.sacred/projects.json` registry is maintained by the CLI (`sacred register` adds a repo; the web app reads this file to discover projects). Cloud sync (GitHub OAuth, team features) is Phase 3 v2.

**Tech stack:** Next.js + Tauri for the desktop shell, Claude API for narration, `~/.sacred/projects.json` as the cross-project index. GitHub OAuth added in Phase 3 v2 to enable cloud sync and sharing.

**Business model:** Sacred Timeline CLI and skill are free and open source (MIT). The web app is open source and self-hostable. The paid offering is **Sacred Timeline Cloud** — hosted version with team timelines, shared experiments, and managed Claude API costs (no user API key required). Teams pay instead of hiring a git training consultant. Self-hosted users pay nothing; teams who want zero setup pay for Cloud.

---

## Implementation Phases

**Phase 1 — CLI + Claude Code Skill (ship together)**
- LLM narration engine: `sacred narrate` calls Claude API (`claude-sonnet-4-6`), replaces commit-counting stub
- `sacred config --api-key <key>` for one-time API key setup, stored in `~/.sacred/config.json`
- `sacred capture --auto` — auto-generates commit message from diff via LLM (no message argument required)
- `sacred narrate --brief` — 2-3 sentence summary mode for use in hooks
- `sacred config --show-git` dev mode toggle
- Sacred Timeline skill file for Claude Code (published after CLI additions above are shipped)
- Auto-capture + narrate hooks in `settings.json`

**Phase 2 — CLI Power Features**
- `sacred narrate <hash>` — explain a specific commit (requires new argument parsing path alongside existing integer parsing)
- `sacred register` — add current repo to `~/.sacred/projects.json` cross-project index
- Conflict resolution: `sacred untangle` (existing vocabulary term, not yet implemented)

**Phase 3 — Desktop App**
- Tauri + Next.js desktop app, local-first (no cloud required)
- Reads repos from `~/.sacred/projects.json` (requires Phase 2's `sacred register`)
- Cross-project timeline view
- AI weekly story powered by Claude API
- `sacred status-line` one-line status output (already implemented in CLI)

**Phase 3 v2 — Cloud**
- GitHub OAuth
- Cloud sync and shared timelines
- Read-only share links

**Phase 4 — Expand**
- OpenClaw / Cline integration (same skill pattern as Claude Code)
- Obsidian plugin upgrade with LLM narration
- Team features in Sacred Timeline Cloud
- Mobile read-only companion (view timeline + narration on phone; capture via mobile is out of scope for v1)

---

## What Makes This Different

Every other git tool assumes you understand git. Sacred Timeline assumes you don't — and then gives power users everything they need anyway. The LLM narration layer is the moat: no other tool can tell you the story of what you built, in plain English, across all your projects.

Git is infrastructure. Sacred Timeline is the human experience on top of it.
