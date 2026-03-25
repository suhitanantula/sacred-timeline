# Sacred Timeline Phase 1 — LLM Narration + Claude Code Skill

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real AI-powered narration to Sacred Timeline, auto-capture and auto-message flags, a config system, and a Claude Code skill — transforming `sacred narrate` from a commit counter into a story of your work.

**Architecture:** New `src/config.ts` manages `~/.sacred/config.json` (API key, show-git flag). New `src/llm.ts` wraps the Claude API with graceful fallback. `git-wrapper.ts` and `cli.ts` are updated to use both. A Claude Code skill file ships last, after the CLI additions it depends on are working.

**Tech Stack:** TypeScript (CommonJS, ES2021), `@anthropic-ai/sdk`, `simple-git` (existing), Node.js `fs` for config file, compiled to `out/` via `tsc`.

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `src/config.ts` | Read/write `~/.sacred/config.json`; get/set api-key and show-git |
| Create | `src/llm.ts` | Claude API client; `generateNarration()`, `generateCaptureMessage()`; fallback handling |
| Modify | `src/git-wrapper.ts` | `narrate()` accepts LLM client; `captureAuto()` new method using diff + LLM |
| Modify | `src/cli.ts` | `capture --auto` flag; `narrate --brief` flag; new `config` command |
| Create | `skills/sacred-timeline.md` | Claude Code skill file (ship after Tasks 1-4 pass) |

---

## Task 1: Config system (`src/config.ts`)

**Files:**
- Create: `src/config.ts`

- [ ] **Step 1: Write the failing test**

Create `src/config.test.ts`:

```typescript
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { SacredConfig } from './config';

// Use a temp dir so tests don't touch real ~/.sacred
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sacred-test-'));
const config = new SacredConfig(tmpDir);

describe('SacredConfig', () => {
    afterAll(() => fs.rmSync(tmpDir, { recursive: true }));

    it('returns null api key when no config exists', () => {
        expect(config.getApiKey()).toBeNull();
    });

    it('saves and retrieves api key', () => {
        config.setApiKey('sk-ant-test123');
        expect(config.getApiKey()).toBe('sk-ant-test123');
    });

    it('show-git defaults to false', () => {
        expect(config.getShowGit()).toBe(false);
    });

    it('saves and retrieves show-git flag', () => {
        config.setShowGit(true);
        expect(config.getShowGit()).toBe(true);
    });

    it('persists config to disk', () => {
        const config2 = new SacredConfig(tmpDir);
        expect(config2.getApiKey()).toBe('sk-ant-test123');
        expect(config2.getShowGit()).toBe(true);
    });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd /Users/suhitanantula/Documents/Git/sacred-timeline
npx ts-node -e "require('./src/config')" 2>&1 | head -5
```
Expected: module not found error.

- [ ] **Step 3: Implement `src/config.ts`**

```typescript
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface ConfigData {
    apiKey?: string;
    showGit?: boolean;
}

export class SacredConfig {
    private configPath: string;
    private data: ConfigData;

    constructor(configDir?: string) {
        const dir = configDir ?? path.join(os.homedir(), '.sacred');
        this.configPath = path.join(dir, 'config.json');
        this.data = this.load();
    }

    private load(): ConfigData {
        try {
            if (fs.existsSync(this.configPath)) {
                return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            }
        } catch { /* ignore corrupt config */ }
        return {};
    }

    private save(): void {
        const dir = path.dirname(this.configPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(this.configPath, JSON.stringify(this.data, null, 2));
    }

    getApiKey(): string | null {
        return process.env.ANTHROPIC_API_KEY ?? this.data.apiKey ?? null;
    }

    setApiKey(key: string): void {
        this.data.apiKey = key;
        this.save();
    }

    getShowGit(): boolean {
        return this.data.showGit ?? false;
    }

    setShowGit(value: boolean): void {
        this.data.showGit = value;
        this.save();
    }
}
```

- [ ] **Step 4: Compile and verify**

```bash
cd /Users/suhitanantula/Documents/Git/sacred-timeline
npm run compile 2>&1
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/suhitanantula/Documents/Git/sacred-timeline
git add src/config.ts
git commit -m "feat: add SacredConfig — api key and show-git stored in ~/.sacred/config.json"
```

---

## Task 2: LLM client (`src/llm.ts`)

**Files:**
- Create: `src/llm.ts`
- Modify: `package.json` (add `@anthropic-ai/sdk`)

- [ ] **Step 1: Install the Anthropic SDK**

```bash
cd /Users/suhitanantula/Documents/Git/sacred-timeline
npm install @anthropic-ai/sdk
```
Expected: package added to `node_modules`, `package.json` updated.

- [ ] **Step 2: Write the failing test**

Create `src/llm.test.ts`:

```typescript
import { SacredLLM } from './llm';

describe('SacredLLM', () => {
    it('returns null when no api key provided', async () => {
        const llm = new SacredLLM(null);
        const result = await llm.generateNarration([], 7);
        expect(result).toBeNull();
    });

    it('returns null for auto-message when no api key', async () => {
        const llm = new SacredLLM(null);
        const result = await llm.generateCaptureMessage('some diff content');
        expect(result).toBeNull();
    });

    it('isAvailable returns false with no key', () => {
        const llm = new SacredLLM(null);
        expect(llm.isAvailable()).toBe(false);
    });

    it('isAvailable returns true with a key', () => {
        const llm = new SacredLLM('sk-ant-fake');
        expect(llm.isAvailable()).toBe(true);
    });
});
```

- [ ] **Step 3: Run to verify it fails**

```bash
cd /Users/suhitanantula/Documents/Git/sacred-timeline
npx ts-node -e "require('./src/llm')" 2>&1 | head -5
```
Expected: module not found.

- [ ] **Step 4: Implement `src/llm.ts`**

```typescript
import Anthropic from '@anthropic-ai/sdk';

export interface CommitInfo {
    hash: string;
    message: string;
    date: string;
    filesChanged?: string[];
}

export class SacredLLM {
    private client: Anthropic | null;

    constructor(apiKey: string | null) {
        this.client = apiKey ? new Anthropic({ apiKey }) : null;
    }

    isAvailable(): boolean {
        return this.client !== null;
    }

    async generateNarration(commits: CommitInfo[], days: number, brief = false): Promise<string | null> {
        if (!this.client) return null;
        if (commits.length === 0) return null;

        const commitList = commits
            .map(c => `- ${c.date}: ${c.message}`)
            .join('\n');

        const prompt = brief
            ? `Summarize this work in 2-3 sentences, past tense, plain English (no jargon):\n\n${commitList}`
            : `You are narrating someone's work history in plain English for a non-technical audience.\n\nThey made the following captures (saves) in the last ${days} days:\n\n${commitList}\n\nWrite a 2-3 paragraph story of what they worked on. Focus on what was built or changed, what experiments were tried, and what progress was made. Use plain language — no git terminology. Write in second person ("You built...", "You tried...").`;

        try {
            const response = await this.client.messages.create({
                model: 'claude-sonnet-4-6',
                max_tokens: brief ? 200 : 600,
                messages: [{ role: 'user', content: prompt }]
            });
            const block = response.content[0];
            return block.type === 'text' ? block.text : null;
        } catch {
            return null;
        }
    }

    async generateCaptureMessage(diff: string): Promise<string | null> {
        if (!this.client) return null;
        if (!diff.trim()) return null;

        const truncatedDiff = diff.length > 4000 ? diff.slice(0, 4000) + '\n...(truncated)' : diff;

        try {
            const response = await this.client.messages.create({
                model: 'claude-sonnet-4-6',
                max_tokens: 80,
                messages: [{
                    role: 'user',
                    content: `Write a single short commit message (under 72 chars) describing these code changes. Be specific, use active voice, no period at end:\n\n${truncatedDiff}`
                }]
            });
            const block = response.content[0];
            if (block.type !== 'text') return null;
            // Strip quotes if the model added them
            return block.text.trim().replace(/^["']|["']$/g, '');
        } catch {
            return null;
        }
    }
}
```

- [ ] **Step 5: Compile and verify**

```bash
cd /Users/suhitanantula/Documents/Git/sacred-timeline
npm run compile 2>&1
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
cd /Users/suhitanantula/Documents/Git/sacred-timeline
git add src/llm.ts package.json package-lock.json
git commit -m "feat: add SacredLLM — Claude API client for narration and auto-capture messages"
```

---

## Task 3: Wire LLM into `git-wrapper.ts`

**Files:**
- Modify: `src/git-wrapper.ts`

- [ ] **Step 1: Add `captureAuto()` method**

After the existing `capture()` method in `src/git-wrapper.ts`, add:

```typescript
/**
 * CAPTURE AUTO: Stage all + generate message via LLM
 * Used by --auto flag and Claude Code hooks
 */
async captureAuto(llm: import('./llm').SacredLLM): Promise<CaptureResult & { usedFallback: boolean }> {
    try {
        const status = await this.git.status();
        if (status.files.length === 0) {
            return { success: false, message: 'Nothing to capture — no changes detected', usedFallback: false };
        }

        // Get diff before staging to generate message
        const diff = await this.git.diff();
        await this.git.add('.');

        // Try LLM message, fall back to timestamp
        let message: string;
        let usedFallback = false;
        const aiMessage = await llm.generateCaptureMessage(diff);
        if (aiMessage) {
            message = aiMessage;
        } else {
            const ts = new Date().toISOString().replace('T', ' ').slice(0, 16);
            message = `session capture: ${ts}`;
            usedFallback = true;
        }

        const result = await this.git.commit(message);
        return { success: true, message: `Captured: "${message}"`, hash: result.commit, usedFallback };
    } catch (error) {
        return {
            success: false,
            message: `Capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            usedFallback: false
        };
    }
}
```

- [ ] **Step 2: Update `narrate()` to accept and use LLM**

Replace the `narrate()` signature and summary-building section in `git-wrapper.ts`:

Change the method signature from:
```typescript
async narrate(days: number = 7): Promise<{
```
to:
```typescript
async narrate(days: number = 7, llm?: import('./llm').SacredLLM, brief = false): Promise<{
```

Then replace the `// Build narrative summary` block (lines 646-675) with:

```typescript
// Build narrative summary — try LLM first, fall back to template
let summary: string;
const aiSummary = llm ? await llm.generateNarration(
    commits.map(c => ({
        hash: c.hash,
        message: c.message,
        date: new Date(c.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
        filesChanged: []
    })),
    days,
    brief
) : null;

if (aiSummary) {
    summary = aiSummary;
} else {
    // Original template fallback
    summary = `In the last ${days} days, you made ${commits.length} capture${commits.length !== 1 ? 's' : ''}.`;
    if (busiestDay && busiestDay.captures > 1) {
        summary += ` Your most productive day was ${busiestDay.day} with ${busiestDay.captures} captures.`;
    }
    if (topFiles.length > 0) {
        summary += ` You worked most on "${topFiles[0].file}" (${topFiles[0].changes} change${topFiles[0].changes !== 1 ? 's' : ''}).`;
    }
    if (activeDays < days / 2) {
        summary += ` You were active on ${activeDays} day${activeDays !== 1 ? 's' : ''} - consider more consistent capturing.`;
    }
}
```

- [ ] **Step 3: Compile and verify**

```bash
cd /Users/suhitanantula/Documents/Git/sacred-timeline
npm run compile 2>&1
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/suhitanantula/Documents/Git/sacred-timeline
git add src/git-wrapper.ts
git commit -m "feat: wire LLM into narrate() and add captureAuto() method"
```

---

## Task 4: Update `cli.ts` — new flags and `config` command

**Files:**
- Modify: `src/cli.ts`

- [ ] **Step 1: Import config and LLM at top of `cli.ts`**

After the existing import line `import { SacredTimeline } from './git-wrapper';`, add:

```typescript
import { SacredConfig } from './config';
import { SacredLLM } from './llm';
```

- [ ] **Step 2: Initialize config and LLM before the switch statement**

After `const sacred = new SacredTimeline(cwd);` and the `isRepo` check, add:

```typescript
const sacredConfig = new SacredConfig();
const llm = new SacredLLM(sacredConfig.getApiKey());
```

- [ ] **Step 3: Update `capture` case to support `--auto`**

Replace the existing `case 'capture':` block:

```typescript
case 'capture': {
    // Check for --auto flag
    const autoFlag = process.argv.includes('--auto');
    const messageParam = process.argv.slice(3).filter(a => a !== '--auto').join(' ');

    if (autoFlag) {
        if (!llm.isAvailable()) {
            console.log(color.dim('Capturing... (add API key for AI messages: sacred config --api-key <key>)'));
        } else {
            console.log(color.dim('Capturing... generating message with AI'));
        }
        const result = await sacred.captureAuto(llm);
        if (result.success) {
            console.log(color.green('📸 ') + result.message);
            if (result.usedFallback) {
                console.log(color.dim('  ↳ Add your Claude API key for AI-generated messages: sacred config --api-key <key>'));
            }
            if (sacredConfig.getShowGit()) {
                console.log(color.dim(`  ↳ git add -A && git commit -m "${result.message.replace('Captured: "', '').replace(/"$/, '')}"`));
            }
        } else {
            console.log(color.yellow('○ ') + result.message);
        }
    } else {
        if (!messageParam) {
            console.log(color.yellow('What did you capture? Please add a message.'));
            console.log(color.dim('Example: sacred capture "finished draft of chapter 3"'));
            console.log(color.dim('Or use: sacred capture --auto  (AI generates the message)'));
            process.exit(1);
        }
        const result = await sacred.capture(messageParam);
        console.log(result.success
            ? color.green('📸 ') + result.message
            : color.yellow('○ ') + result.message);
        if (result.success && sacredConfig.getShowGit()) {
            console.log(color.dim(`  ↳ git add -A && git commit -m "${messageParam}"`));
        }
    }
    break;
}
```

- [ ] **Step 4: Update `narrate` case to support `--brief` and use LLM**

Replace the existing `case 'narrate':` block:

```typescript
case 'narrate': {
    const briefFlag = process.argv.includes('--brief');
    const daysParam = process.argv.slice(2).filter(a => a !== 'narrate' && a !== '--brief').join(' ');
    const days = daysParam ? parseInt(daysParam, 10) : 7;

    if (isNaN(days) || days < 1) {
        console.log(color.yellow('Please provide a valid number of days.'));
        console.log(color.dim('Example: sacred narrate 30'));
        process.exit(1);
    }

    if (!briefFlag) {
        if (llm.isAvailable()) {
            console.log(color.dim(`Analyzing the last ${days} days with AI...\n`));
        } else {
            console.log(color.dim(`Analyzing the last ${days} days...\n`));
            console.log(color.dim('  ↳ Add your Claude API key for AI narration: sacred config --api-key <key>\n'));
        }
    }

    const result = await sacred.narrate(days, llm, briefFlag);

    if (briefFlag) {
        console.log(result.summary);
    } else {
        console.log(color.bold('📖 Your Story:\n'));
        console.log(result.summary);
        console.log();
        if (result.stats.topFiles.length > 0) {
            console.log(color.bold('Most Active Files:'));
            result.stats.topFiles.forEach((f, i) => {
                console.log(color.dim(`  ${i + 1}.`) + ` ${f.file} ` + color.dim(`(${f.changes} changes)`));
                console.log(color.dim(`     ${f.path}`));
            });
            console.log();
        }
    }
    break;
}
```

- [ ] **Step 5: Add `config` command to the switch statement**

Add before the `default:` case:

```typescript
case 'config': {
    const flags = process.argv.slice(3);
    const apiKeyIdx = flags.indexOf('--api-key');
    const showGitIdx = flags.indexOf('--show-git');
    const hideGitIdx = flags.indexOf('--hide-git');

    if (apiKeyIdx !== -1 && flags[apiKeyIdx + 1]) {
        const key = flags[apiKeyIdx + 1];
        sacredConfig.setApiKey(key);
        console.log(color.green('✓ ') + 'API key saved. AI narration is now active.');
        console.log(color.dim('  Try: sacred narrate'));
    } else if (showGitIdx !== -1) {
        sacredConfig.setShowGit(true);
        console.log(color.green('✓ ') + 'Dev mode on. Git commands shown alongside sacred commands.');
    } else if (hideGitIdx !== -1) {
        sacredConfig.setShowGit(false);
        console.log(color.green('✓ ') + 'Dev mode off.');
    } else {
        // Show current config
        console.log(color.bold('\nSacred Timeline Config:\n'));
        console.log('  API key:  ' + (sacredConfig.getApiKey() ? color.green('✓ configured') : color.yellow('not set') + color.dim('  →  sacred config --api-key <key>')));
        console.log('  Dev mode: ' + (sacredConfig.getShowGit() ? color.green('on') : color.dim('off') + color.dim('  →  sacred config --show-git')));
        console.log();
    }
    break;
}
```

- [ ] **Step 6: Update help text to include new flags and config command**

In the `getHelpText()` function, replace:
```typescript
  ${color.green('narrate')} [days]       Tell me the story of my recent work (default: 7 days)
```
with:
```typescript
  ${color.green('capture')} "message"     Save this moment with a description
  ${color.green('capture')} --auto        Save this moment (AI generates the message)
  ${color.green('narrate')} [days]        Tell me the story of my recent work (default: 7 days)
  ${color.green('narrate')} --brief       One-paragraph summary (for hooks)
  ${color.green('config')} --api-key <k> Set your Claude API key for AI narration
  ${color.green('config')} --show-git     Show git commands alongside sacred commands
```

Note: only add the new lines, keep all existing lines.

- [ ] **Step 7: Compile**

```bash
cd /Users/suhitanantula/Documents/Git/sacred-timeline
npm run compile 2>&1
```
Expected: no errors.

- [ ] **Step 8: Smoke test**

```bash
cd /Users/suhitanantula/Documents/Git/sacred-timeline
node out/cli.js config
node out/cli.js narrate 7
```
Expected: config shows "not set", narrate runs and shows template fallback with prompt to add API key.

- [ ] **Step 9: Set API key and test AI narration**

```bash
cd /Users/suhitanantula/Documents/Git/sacred-timeline
node out/cli.js config --api-key <your-key>
node out/cli.js narrate 7
```
Expected: AI narrative story appears instead of template text.

- [ ] **Step 10: Test `--brief` flag**

```bash
cd /Users/suhitanantula/Documents/Git/sacred-timeline
node out/cli.js narrate --brief
```
Expected: 2-3 sentence summary, no "Most Active Files" section.

- [ ] **Step 11: Test `capture --auto` on ethnobot**

```bash
cd /Volumes/Extreme-2TB/Git/ethnobot
# Make a small edit to any file to create a diff
echo "# test" >> /tmp/test-sacred.txt
cp /tmp/test-sacred.txt .
node /Users/suhitanantula/Documents/Git/sacred-timeline/out/cli.js capture --auto
```
Expected: AI-generated capture message, or fallback timestamp message with API key prompt.

Then clean up:
```bash
cd /Volumes/Extreme-2TB/Git/ethnobot
git reset HEAD test-sacred.txt 2>/dev/null; rm -f test-sacred.txt
```

- [ ] **Step 12: Test `show-git` mode**

```bash
cd /Users/suhitanantula/Documents/Git/sacred-timeline
node out/cli.js config --show-git
node out/cli.js capture "test show-git mode"
```
Expected: capture succeeds and shows `↳ git add -A && git commit -m "..."` line beneath.

Then turn it off:
```bash
node out/cli.js config --hide-git
```

- [ ] **Step 13: Commit**

```bash
cd /Users/suhitanantula/Documents/Git/sacred-timeline
git add src/cli.ts
git commit -m "feat: add capture --auto, narrate --brief, and config command to CLI"
```

---

## Task 5: Publish updated npm package

**Files:**
- Modify: `package.json` (version bump)

- [ ] **Step 1: Bump version**

In `package.json`, change `"version": "1.0.0"` to `"version": "1.1.0"`.

- [ ] **Step 2: Compile and publish**

```bash
cd /Users/suhitanantula/Documents/Git/sacred-timeline
npm run compile
npm publish --access public
```
Expected: package published to npm as `@suhitanantula/sacred-timeline@1.1.0`.

- [ ] **Step 3: Verify install**

```bash
npm install -g @suhitanantula/sacred-timeline
sacred config
```
Expected: global sacred command updated, config shows current state.

- [ ] **Step 4: Commit**

```bash
cd /Users/suhitanantula/Documents/Git/sacred-timeline
git add package.json
git commit -m "chore: bump to 1.1.0 — AI narration, capture --auto, config command"
```

---

## Task 6: Claude Code skill file

**Files:**
- Create: `skills/sacred-timeline.md`

*Only write this after Tasks 1-4 are working and the npm package is published.*

- [ ] **Step 1: Create the skill file**

Create `skills/sacred-timeline.md`:

```markdown
---
name: sacred-timeline
description: Use Sacred Timeline (git for humans) in every session. Auto-captures work, narrates progress, and suggests experiments before risky changes. Use sacred vocabulary throughout: capture (not commit), experiment (not branch), backup (not push).
---

# Sacred Timeline — Git for Humans

You have the Sacred Timeline CLI available: `sacred` command.

## Your role

Use Sacred Timeline to manage all git operations in this session. Never use raw git commands with the user. Use sacred language:
- "capture" not "commit"
- "experiment" not "branch"
- "backup" not "push"
- "latest" not "pull"
- "timeline" not "git log"

## Session start

When starting work in a git repo, run:
```bash
sacred status
```
Show the user the current state in plain language.

If the user is about to make significant changes, ask:
> "Want to start an experiment first so you can safely explore? Run `sacred experiment "name"` to create a safe space."

## During the session

After completing a significant chunk of work (new feature, bug fix, major edit), suggest:
> "Good moment to capture this — want me to run `sacred capture --auto`? I'll generate the message from what changed."

Then run it if they agree.

## Session end

When wrapping up (user says done, or on Stop hook), run:
```bash
sacred capture --auto && sacred narrate --brief
```

Then tell the user:
- What was captured (the message)
- A 2-3 sentence story of what was accomplished
- Whether there are captures to backup: "You have X captures to backup — run `sacred backup` when ready"

## Setup check

If `sacred config` shows no API key:
> "For AI-generated capture messages and narration, add your Anthropic API key: `sacred config --api-key <key>`"

## Dev mode

If the user is clearly a developer (uses git terminology, asks about branches, etc.), mention once:
> "Want to see the git commands Sacred Timeline is running? Try `sacred config --show-git`"

## Claude Code hooks (settings.json)

To automate captures at session end, add to `.claude/settings.json`:
```json
{
  "hooks": {
    "Stop": "sacred capture --auto && sacred narrate --brief"
  }
}
```
```

- [ ] **Step 2: Install the skill for yourself**

```bash
cp /Users/suhitanantula/Documents/Git/sacred-timeline/skills/sacred-timeline.md \
   /Users/suhitanantula/.claude/plugins/skills/sacred-timeline.md 2>/dev/null || \
mkdir -p /Users/suhitanantula/.claude/skills && \
cp /Users/suhitanantula/Documents/Git/sacred-timeline/skills/sacred-timeline.md \
   /Users/suhitanantula/.claude/skills/sacred-timeline.md
```

- [ ] **Step 3: Commit**

```bash
cd /Users/suhitanantula/Documents/Git/sacred-timeline
git add skills/
git commit -m "feat: add Claude Code skill file for sacred-timeline"
```

---

## Task 7: Final capture and backup

- [ ] **Step 1: Run narrate to verify full flow**

```bash
cd /Users/suhitanantula/Documents/Git/sacred-timeline
sacred narrate 7
```
Expected: AI narrative of Phase 1 work across all the commits above.

- [ ] **Step 2: Backup to GitHub**

```bash
cd /Users/suhitanantula/Documents/Git/sacred-timeline
sacred backup
```

- [ ] **Step 3: Done**

Phase 1 is complete. Sacred Timeline now has:
- Real AI narration via Claude API
- `sacred capture --auto` with AI-generated messages
- `sacred narrate --brief` for hooks
- `sacred config` for API key and dev mode
- Claude Code skill for automated session management
