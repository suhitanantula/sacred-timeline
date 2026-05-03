# Sacred Timeline Starter Prompts

These prompts are for people who are already using an AI agent to build, edit, or ship real work. They avoid git language and position Sacred Timeline as the project safety layer.

## Universal First-Run Prompt

Paste this into Codex, Claude Code, Cursor, OpenClaw, or any agent that can run terminal commands:

```text
Before we change this project, I want to protect it with Sacred Timeline.

I do not know git, so use plain language. Treat Sacred Timeline as the safety layer for this AI-built work.

Please do this:

1. Check where we are working.
2. Check whether Sacred Timeline is installed with: command -v sacred
3. If it is not installed, install it with:
   curl -fsSL https://raw.githubusercontent.com/suhitanantula/sacred-timeline/main/install.sh | bash
4. Run: sacred doctor
5. Run: sacred status
6. If this folder is not protected yet, run: sacred start
7. Explain what you found in plain English.
8. Before making changes, tell me whether we should capture the current state or start an experiment.

From now on, use Sacred Timeline language:
- capture = save this moment
- experiment = try something risky safely
- keep = make the experiment part of the main version
- discard = abandon the experiment
- backup = send protected work to cloud
- latest = get protected work from cloud
- narrate = tell me the story of what changed

Do not teach me raw git unless I explicitly ask.
```

## Codex Plugin Prompt

Use this when Sacred Timeline is available as a Codex plugin/MCP tool:

```text
Use the Sacred Timeline plugin before doing any project work.

First:
1. Run the Sacred Timeline doctor/status tools for this workspace.
2. Tell me whether this project is protected, clean, backed up, and connected to cloud.
3. If there are unprotected or uncommitted changes, recommend the next safe action in plain English.

During the work:
- Capture useful milestones.
- Start an experiment before risky changes.
- Keep or discard experiments based on the result.
- End by narrating what changed and telling me whether anything still needs backup.

Assume I am not a developer. Do not lead with git terminology.
```

## Claude Code Skill Prompt

Use this when `/sacred-timeline` is installed:

```text
/sacred-timeline

Before we begin, protect this project with Sacred Timeline.

Please run sacred doctor and sacred status, then explain:
- whether this folder is protected
- whether there are changes since the last capture
- whether cloud backup is connected
- whether we should capture, backup, or start an experiment before continuing

Use sacred language throughout the session. Suggest captures at natural milestones, and wrap up with sacred narrate.
```

## Risky Change Prompt

Use this before asking an agent to make a major change:

```text
I want to try a risky direction, but I do not want to break the working version.

Use Sacred Timeline to start an experiment first:

sacred experiment "short-name-for-this-risky-direction"

Then make the change. When you are done:
1. Show me what changed with sacred changes.
2. Explain whether the experiment worked.
3. Ask whether to keep it or discard it.

Do not merge it into the main timeline unless I say to keep it.
```

## Session Wrap Prompt

Use this at the end of a working session:

```text
Wrap up this session with Sacred Timeline.

Please:
1. Run sacred changes.
2. If there is meaningful work, capture it with a plain-English message.
3. Run sacred narrate 7.
4. Run sacred status.
5. Tell me the story of what changed and whether anything needs backup.

Keep the explanation simple. I care about what changed, what is safe, and what I need to do next.
```

## One-Line CTA Prompt

```text
Before this AI agent changes anything, protect the project with Sacred Timeline.
```
