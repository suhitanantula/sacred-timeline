# Sacred Timeline - Future Development Ideas

## Narrate Command (Priority)

**Concept**: A `narrate` command that generates a plain-English summary of recent timeline activity.

**Example output**:
> "In the last week, you made 12 checkpoints. The biggest changes were on Tuesday when you rewrote the methodology section. You started 2 experiments - one you kept ('bold-intro'), one you discarded ('alternate-ending'). Your most active files were Chapter3.md and research-notes.md."

**Why this matters**:
- Non-coders don't think in commits/diffs - they think in narrative
- Reflection is valuable for knowledge workers
- Natural place for AI assistance (summarize what changed, not just list it)
- Bridges the gap between "what git tracks" and "what humans care about"

**Implementation ideas**:
1. Basic version: Parse git log, count commits, identify most-changed files
2. Enhanced version: Use AI to summarize commit messages into coherent narrative
3. Advanced version: Weekly email/notification with timeline summary

**Potential variations**:
- `narrate week` - last 7 days
- `narrate month` - last 30 days
- `narrate experiment "name"` - what happened in a specific experiment
- `narrate file "path"` - history of a specific file in plain English

**UI placement**:
- Command palette: "Sacred Timeline: Narrate my progress"
- Sidebar: "What happened this week?" button
- Scheduled: Weekly summary notification

---

## Other Future Ideas

### Onboarding Flow
- First-time user wizard
- "Start your first timeline" guided experience
- Explain concepts as they encounter them

### AI Integration
- AI-generated checkpoint messages (describe what changed)
- Smart conflict resolution suggestions
- "Explain this change" for any timeline entry

### Collaboration Features
- "Who changed this?" in plain English
- Team timeline view
- Shared experiments

### Export/Reporting
- Export timeline as PDF report
- "Progress report" for clients/managers
- Change log generation

---

*Ideas captured: 2025-11-27*
