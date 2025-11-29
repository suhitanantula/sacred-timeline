# Sacred Timeline

**Git for humans: Innovation architecture for the AI age**

Most knowledge workers have never heard of Git. Yet it's the most powerful tool for managing ideas, experiments, and collaborative intelligence ever created.

Sacred Timeline makes version control accessible to non-coders through human-friendly language and visual interfaces.

## The Problem

Everyone creates the same mess:
- `Strategy-Doc_v1.docx`
- `Strategy-Doc_v2_final.docx`
- `Strategy-Doc_v2_final_FINAL.docx`

Which one is current? What changed? Where did that idea go?

## The Solution

Git assumes work is not linear. Multiple experiments happen simultaneously. Some fail, some succeed. Sacred Timeline brings this power to everyone.

## The Language

| What you mean | Sacred Timeline | What Git calls it |
|---------------|-----------------|-------------------|
| Save this moment | `capture` | git commit |
| Summarize my progress | `narrate` | git log (analyzed) |
| Get latest from cloud | `latest` | git pull |
| Send to cloud | `backup` | git push |
| What did I change? | `changes` | git diff/status |
| Show me history | `timeline` | git log |
| Try something risky | `experiment` | git branch |
| Keep the experiment | `keep` | git merge |
| Abandon experiment | `discard` | git branch -d |
| Go back to earlier | `restore` | git checkout |
| Start fresh | `start` | git init |
| Connect to cloud | `connect` | git remote add |
| Something's tangled | `untangle` | merge conflict |

## Features

### Visual Sidebar
- One-click capture, latest, backup
- See changes at a glance
- Browse your timeline visually
- Experiment status always visible

### Command Palette
All commands available via `Cmd+Shift+P`:
- "Sacred Timeline: Capture"
- "Sacred Timeline: Latest"
- "Sacred Timeline: Backup"
- etc.

### Keyboard Shortcuts
- `Cmd+Shift+S` - Capture (save this moment)
- `Cmd+Shift+L` - Latest (get from cloud)
- `Cmd+Shift+B` - Backup (send to cloud)

### Status Bar
Always shows:
- Current branch/experiment
- Unsaved changes indicator
- Sync status with cloud

## Installation

### CLI (Terminal)
```bash
npm install -g github:suhitanantula/sacred-timeline
```

Then use anywhere:
```bash
sacred capture "Added new feature"
sacred latest
sacred backup
sacred timeline
```

### VS Code Extension
1. Open VS Code
2. Go to Extensions (Cmd+Shift+X)
3. Search for "Sacred Timeline"
4. Click Install

## Quick Start

### For a new project:
1. Open your folder in VS Code
2. Click "Start Timeline" in the sidebar
3. Make some changes
4. Click "Capture" and describe what you did
5. Click "Connect" to link to GitHub
6. Click "Backup" to save to cloud

### Daily workflow:
1. Open VS Code
2. Click "Latest" to get any changes
3. Do your work
4. Click "Capture" when you reach a milestone
5. Click "Backup" when done for the day

### Trying something risky:
1. Click "Experiment" and name it
2. Make your changes freely
3. If it works: Click "Keep"
4. If it doesn't: Click "Discard"

## Philosophy

This project is built on the idea that Git is **innovation architecture**, not just version control.

- **Capture** = "I tried something and here's what I learned"
- **Backup** = "Sharing my learning into the collective universe"
- **Latest** = "Bringing the latest collective thinking into my work"
- **Experiment** = "Starting a safe space to try something risky"
- **Keep** = "This experiment succeeded, make it the new normal"

The Marvel analogy: Your main timeline is sacred. Experiments are variant timelines. You can explore variants without breaking the sacred timeline, and merge the successful ones back.

## Who This Is For

- Writers managing book manuscripts
- Consultants building frameworks
- Researchers tracking ideas
- Knowledge workers who collaborate with AI
- Anyone tired of `_v2_final_FINAL.docx`

## Development

```bash
# Clone the repo
git clone https://github.com/suhitanantula/sacred-timeline.git

# Install dependencies
npm install

# Compile
npm run compile

# Run in VS Code
Press F5 to launch Extension Development Host
```

## Credits

Built by [Suhit Anantula](https://github.com/suhitanantula) as part of the Co-Intelligent Organisation book project.

The language design was inspired by the insight that top-level coders, strategists, and knowledge workers will all work the same way in the AI age.

## License

MIT
