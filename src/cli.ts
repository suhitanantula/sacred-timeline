#!/usr/bin/env node
/**
 * Sacred Timeline CLI
 * Git for humans - command line edition
 */

import { SacredTimeline } from './git-wrapper';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const color = {
    bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
    dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
    green: (s: string) => `\x1b[32m${s}\x1b[0m`,
    red: (s: string) => `\x1b[31m${s}\x1b[0m`,
    yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
    blue: (s: string) => `\x1b[34m${s}\x1b[0m`,
    cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
    grey: (s: string) => `\x1b[90m${s}\x1b[0m`,
};

// Smart icons based on commit message keywords
function getSmartIcon(message: string): string {
    const msg = message.toLowerCase();

    // Check for conventional commit prefixes first
    if (msg.startsWith('feat:') || msg.startsWith('feat(')) return '✨';
    if (msg.startsWith('fix:') || msg.startsWith('fix(')) return '🔧';
    if (msg.startsWith('docs:') || msg.startsWith('doc:')) return '📝';
    if (msg.startsWith('style:')) return '🎨';
    if (msg.startsWith('refactor:')) return '♻️';
    if (msg.startsWith('test:')) return '🧪';
    if (msg.startsWith('chore:')) return '🔩';
    if (msg.startsWith('security:') || msg.startsWith('sec:')) return '🔒';
    if (msg.startsWith('perf:')) return '⚡';
    if (msg.startsWith('build:') || msg.startsWith('ci:')) return '📦';

    // Check for keywords in message
    if (msg.includes('initial') || msg.includes('first') || msg.includes('start')) return '🎉';
    if (msg.includes('add') || msg.includes('new') || msg.includes('create')) return '✨';
    if (msg.includes('fix') || msg.includes('bug') || msg.includes('issue')) return '🔧';
    if (msg.includes('update') || msg.includes('change') || msg.includes('modify')) return '🔄';
    if (msg.includes('remove') || msg.includes('delete') || msg.includes('clean')) return '🗑️';
    if (msg.includes('refactor') || msg.includes('improve') || msg.includes('enhance')) return '♻️';
    if (msg.includes('rename')) return '📛';
    if (msg.includes('move') || msg.includes('reorganize')) return '📦';
    if (msg.includes('merge')) return '🔀';
    if (msg.includes('security') || msg.includes('auth') || msg.includes('password')) return '🔒';
    if (msg.includes('test')) return '🧪';
    if (msg.includes('doc') || msg.includes('readme') || msg.includes('comment')) return '📝';
    if (msg.includes('config') || msg.includes('setting')) return '⚙️';
    if (msg.includes('deploy') || msg.includes('release') || msg.includes('publish')) return '🚀';
    if (msg.includes('wip') || msg.includes('progress') || msg.includes('draft')) return '🚧';
    if (msg.includes('finish') || msg.includes('complete') || msg.includes('done')) return '✅';

    return '○';  // Default: simple circle
}

// Clean up commit message for display (remove conventional commit prefixes)
function cleanMessage(message: string): string {
    // Remove conventional commit prefix like "feat: " or "fix(scope): "
    let clean = message.replace(/^(feat|fix|docs|style|refactor|test|chore|security|perf|build|ci)(\([^)]+\))?:\s*/i, '');

    // Capitalize first letter
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);

    return clean;
}

// Group timeline entries by date
function groupByDate(entries: { date: Date; message: string; relativeDate: string; hash: string; shortHash: string; author: string }[]): { [key: string]: typeof entries } {
    const groups: { [key: string]: typeof entries } = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);

    for (const entry of entries) {
        const entryDate = new Date(entry.date.getFullYear(), entry.date.getMonth(), entry.date.getDate());
        let label: string;

        if (entryDate.getTime() === today.getTime()) {
            label = 'Today';
        } else if (entryDate.getTime() === yesterday.getTime()) {
            label = 'Yesterday';
        } else {
            // Format as "Nov 22" for other dates
            label = entry.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

        if (!groups[label]) {
            groups[label] = [];
        }
        groups[label].push(entry);
    }

    return groups;
}

// Get color based on recency (green -> grey fade)
function getRecencyColor(dateLabel: string, groupIndex: number, totalGroups: number): (s: string) => string {
    if (dateLabel === 'Today') return color.green;
    if (dateLabel === 'Yesterday') return color.cyan;
    if (groupIndex < totalGroups * 0.3) return color.blue;
    if (groupIndex < totalGroups * 0.6) return color.dim;
    return color.grey;
}

function getHelpText(): string {
    return `
${color.bold('Sacred Timeline')} - Git for humans

${color.dim('Commands:')}
  ${color.green('capture')} "message"     Save this moment with a description
  ${color.green('latest')}               Bring the latest from cloud
  ${color.green('backup')}               Send to cloud
  ${color.green('backup-all')}           Backup all worktrees (for multi-branch repos)
  ${color.green('changes')}              What did I change?
  ${color.green('timeline')}             Show me history
  ${color.green('narrate')} [days]       Tell me the story of my recent work (default: 7 days)
  ${color.green('experiment')} "name"    Try something risky (create branch)
  ${color.green('keep')}                 Keep the experiment (merge to main)
  ${color.green('discard')}              Abandon experiment (delete branch)
  ${color.green('restore')} <hash>       Go back to earlier moment
  ${color.green('start')}                Begin fresh project (git init)
  ${color.green('connect')} <url>        Link to cloud (add remote)
  ${color.green('status')}               Show current state
  ${color.green('doctor')}               Check Sacred Timeline setup
  ${color.green('init-shell')}           Setup auto-status on cd (add to .zshrc)

${color.dim('Examples:')}
  sacred capture "finished draft of chapter 3"
  sacred experiment "bold-new-intro"
  sacred narrate
  sacred narrate 30
  sacred timeline
  sacred status --json
`;
}

function printJson(value: unknown): void {
    console.log(JSON.stringify(value, null, 2));
}

function getCommandOutput(command: string): string | null {
    try {
        return execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch {
        return null;
    }
}

function getInstalledVersion(): string {
    try {
        const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
        const packagePaths = [
            path.join(globalRoot, '@suhit/sacred-timeline/package.json'),
            path.join(globalRoot, 'sacred-timeline/package.json')
        ];
        for (const packagePath of packagePaths) {
            if (fs.existsSync(packagePath)) {
                const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
                return pkg.version || 'unknown';
            }
        }
    } catch {
        // Fall through to unknown.
    }
    return 'unknown';
}

async function buildStatusPayload(sacred: SacredTimeline): Promise<unknown> {
    const status = await sacred.getStatusSummary();
    const changes = await sacred.changes();
    const branch = await sacred.getCurrentBranch();
    const remotes = await sacred.getRemotes();
    return {
        isRepo: status.isRepo,
        branch,
        currentExperiment: status.currentExperiment,
        changes,
        aheadOfCloud: status.aheadOfCloud,
        behindCloud: status.behindCloud,
        hasConflicts: status.hasConflicts,
        connected: remotes.length > 0,
        remotes
    };
}

async function buildDoctorPayload(sacred: SacredTimeline, cwd: string): Promise<{
    ok: boolean;
    checks: { name: string; ok: boolean; detail: string }[];
    recommendations: string[];
}> {
    const checks: { name: string; ok: boolean; detail: string }[] = [];
    const recommendations: string[] = [];

    const nodeVersion = getCommandOutput('node --version');
    checks.push({
        name: 'node',
        ok: Boolean(nodeVersion),
        detail: nodeVersion || 'Node.js not found'
    });

    const npmVersion = getCommandOutput('npm --version');
    checks.push({
        name: 'npm',
        ok: Boolean(npmVersion),
        detail: npmVersion || 'npm not found'
    });

    const gitVersion = getCommandOutput('git --version');
    checks.push({
        name: 'git',
        ok: Boolean(gitVersion),
        detail: gitVersion || 'git not found'
    });

    const sacredPath = getCommandOutput('command -v sacred');
    checks.push({
        name: 'sacred-cli',
        ok: Boolean(sacredPath),
        detail: sacredPath || 'sacred command not found on PATH'
    });

    checks.push({
        name: 'sacred-version',
        ok: getInstalledVersion() !== 'unknown',
        detail: getInstalledVersion()
    });

    const isRepo = await sacred.isRepository();
    checks.push({
        name: 'timeline',
        ok: isRepo,
        detail: isRepo ? `Sacred Timeline active in ${cwd}` : 'Not a git-backed timeline yet'
    });
    if (!isRepo) {
        recommendations.push('Run `sacred start` in this folder to begin a timeline.');
    }

    if (isRepo) {
        const status = await sacred.getStatusSummary();
        const remotes = await sacred.getRemotes();
        checks.push({
            name: 'cloud-connection',
            ok: remotes.length > 0,
            detail: remotes.length > 0 ? remotes.map(remote => remote.name).join(', ') : 'No cloud remote configured'
        });
        if (remotes.length === 0) {
            recommendations.push('Run `sacred connect <github-url>` to connect this timeline to cloud backup.');
        }

        checks.push({
            name: 'sync',
            ok: status.aheadOfCloud === 0 && status.behindCloud === 0,
            detail: `ahead=${status.aheadOfCloud}, behind=${status.behindCloud}`
        });
        if (status.aheadOfCloud > 0) {
            recommendations.push('Run `sacred backup` to send local captures to cloud.');
        }
        if (status.behindCloud > 0) {
            recommendations.push('Run `sacred latest` to bring cloud captures into this folder.');
        }
        if (status.hasConflicts) {
            recommendations.push('Run `sacred untangle` or resolve the tangled timeline before continuing.');
        }
    }

    const codexSkill = path.join(os.homedir(), '.codex/skills/sacred-timeline/SKILL.md');
    checks.push({
        name: 'codex-skill',
        ok: fs.existsSync(codexSkill),
        detail: fs.existsSync(codexSkill) ? codexSkill : 'Codex skill not installed'
    });
    if (!fs.existsSync(codexSkill)) {
        recommendations.push('Re-run the installer to add the Codex skill: `curl -fsSL https://raw.githubusercontent.com/suhitanantula/sacred-timeline/main/install.sh | bash`');
    }

    const claudeSkill = path.join(os.homedir(), '.claude/skills/sacred-timeline/SKILL.md');
    checks.push({
        name: 'claude-skill',
        ok: fs.existsSync(claudeSkill),
        detail: fs.existsSync(claudeSkill) ? claudeSkill : 'Claude Code skill not installed'
    });
    if (!fs.existsSync(claudeSkill)) {
        recommendations.push('Re-run the installer to add the Claude Code skill.');
    }

    return {
        ok: checks.every(check => check.ok),
        checks,
        recommendations
    };
}

async function main() {
    const args = process.argv.slice(2);
    const json = args.includes('--json') || args.includes('-j');
    const commandArgs = args.filter(arg => arg !== '--json' && arg !== '-j');
    const command = commandArgs[0]?.toLowerCase();
    const param = commandArgs.slice(1).join(' ');

    if (!command || command === 'help' || command === '--help' || command === '-h') {
        console.log(getHelpText());
        process.exit(0);
    }

    const cwd = process.cwd();
    const sacred = new SacredTimeline(cwd);

    // Check if this is a git repo for most commands
    const isRepo = await sacred.isRepository();
    if (!isRepo && !['start', 'help', 'doctor'].includes(command)) {
        if (json) {
            printJson({
                success: false,
                error: 'not_a_timeline',
                message: 'Not a Sacred Timeline yet. Run `sacred start` to begin.'
            });
            process.exit(1);
        }
        console.log(color.yellow('⚠ ') + 'Not a Sacred Timeline yet. Run ' + color.green('sacred start') + ' to begin.');
        process.exit(1);
    }

    try {
        switch (command) {
            case 'capture': {
                if (!param) {
                    console.log(color.yellow('What did you capture? Please add a message.'));
                    console.log(color.dim('Example: sacred capture "finished draft of chapter 3"'));
                    process.exit(1);
                }
                const result = await sacred.capture(param);
                if (json) {
                    printJson(result);
                    break;
                }
                console.log(result.success
                    ? color.green('📸 ') + result.message
                    : color.yellow('○ ') + result.message);
                break;
            }

            case 'latest': {
                if (!json) {
                    console.log(color.dim('Getting the latest from cloud...'));
                }
                const result = await sacred.update();
                if (json) {
                    printJson(result);
                    break;
                }
                console.log(result.success
                    ? color.green('✓ ') + result.message
                    : color.yellow('○ ') + result.message);
                break;
            }

            case 'backup': {
                if (!json) {
                    console.log(color.dim('Backing up to cloud...'));
                }
                const result = await sacred.backup();
                if (json) {
                    printJson(result);
                    break;
                }
                console.log(result.success
                    ? color.green('☁ ') + result.message
                    : color.yellow('○ ') + result.message);
                break;
            }

            case 'backup-all': {
                if (!json) {
                    console.log(color.dim('Backing up all worktrees...\n'));
                }
                const result = await sacred.backupAll();
                if (json) {
                    printJson(result);
                    break;
                }

                if (result.results.length === 0) {
                    // No worktrees, just show regular backup result
                    console.log(result.success
                        ? color.green('☁ ') + result.message
                        : color.yellow('○ ') + result.message);
                } else {
                    // Show each worktree result
                    for (const wt of result.results) {
                        const icon = wt.success ? color.green('☁') : color.yellow('○');
                        const branchInfo = color.dim(`(${wt.branch})`);
                        console.log(`${icon} ${wt.name} ${branchInfo}`);
                        console.log(color.dim(`    ${wt.message}`));
                    }
                    console.log();
                    console.log(result.success
                        ? color.green('✓ ') + result.message
                        : color.yellow('○ ') + result.message);
                }
                break;
            }

            case 'changes': {
                const result = await sacred.changes();
                if (json) {
                    printJson(result);
                    break;
                }
                if (!result.hasChanges) {
                    console.log(color.dim('No changes since last capture.'));
                } else {
                    console.log(color.bold('\nChanges:\n'));
                    if (result.untracked.length > 0) {
                        console.log(color.blue('New files:'));
                        result.untracked.forEach(f => console.log(color.blue('  + ') + f));
                        console.log();
                    }
                    if (result.unstaged.length > 0) {
                        console.log(color.yellow('Modified:'));
                        result.unstaged.forEach(f => console.log(color.yellow('  ~ ') + f));
                        console.log();
                    }
                    if (result.staged.length > 0) {
                        console.log(color.green('Ready to capture:'));
                        result.staged.forEach(f => console.log(color.green('  ✓ ') + f));
                        console.log();
                    }
                    console.log(color.dim(`Summary: ${result.summary}`));
                }
                break;
            }

            case 'timeline': {
                const entries = await sacred.timeline(30);
                if (json) {
                    printJson(entries);
                    break;
                }
                if (entries.length === 0) {
                    console.log(color.dim('No captures yet. Create your first with: sacred capture "your message"'));
                } else {
                    // Get repo name from current directory
                    const repoName = cwd.split('/').pop() || 'Timeline';

                    // Print header
                    console.log();
                    console.log(color.bold(repoName));
                    console.log(color.dim('━'.repeat(Math.min(repoName.length + 10, 40))));
                    console.log();

                    // Group entries by date
                    const grouped = groupByDate(entries);

                    // Calculate max commits per day for activity bar scaling
                    const maxCommits = Math.max(...Object.values(grouped).map(g => g.length));

                    // Display each group
                    const groupKeys = Object.keys(grouped);
                    const totalGroups = groupKeys.length;

                    groupKeys.forEach((dateLabel, groupIndex) => {
                        const dayEntries = grouped[dateLabel];

                        // Get color based on recency
                        const recencyColor = getRecencyColor(dateLabel, groupIndex, totalGroups);

                        // Activity bar (1-6 blocks based on relative activity)
                        const barLength = Math.ceil((dayEntries.length / maxCommits) * 6);
                        const activityBar = '█'.repeat(barLength);

                        // Date header with activity bar
                        const padding = 45 - dateLabel.length;
                        const headerColor = groupIndex === 0 ? color.bold : (groupIndex < 2 ? (s: string) => s : color.dim);
                        console.log(headerColor(dateLabel) + ' '.repeat(Math.max(padding, 2)) + recencyColor(activityBar));

                        // Entries for this day
                        dayEntries.forEach((entry, i) => {
                            const isFirst = groupIndex === 0 && i === 0;
                            const dot = isFirst ? color.green('●') : recencyColor('○');
                            const icon = getSmartIcon(entry.message);
                            const cleanMsg = cleanMessage(entry.message);
                            const displayMsg = cleanMsg.length > 42
                                ? cleanMsg.substring(0, 39) + '...'
                                : cleanMsg;

                            // Apply recency color to message for older entries
                            const msgColor = groupIndex < 2 ? (s: string) => s : recencyColor;

                            // Show time for today's entries
                            let timeStr = '';
                            if (dateLabel === 'Today') {
                                timeStr = '  ' + color.dim(entry.relativeDate);
                            }

                            console.log(`  ${dot} ${icon} ${msgColor(displayMsg)}${timeStr}`);
                        });
                        console.log();
                    });
                }
                break;
            }

            case 'narrate': {
                const days = param ? parseInt(param, 10) : 7;
                if (isNaN(days) || days < 1) {
                    console.log(color.yellow('Please provide a valid number of days.'));
                    console.log(color.dim('Example: sacred narrate 30'));
                    process.exit(1);
                }
                if (!json) {
                    console.log(color.dim(`Analyzing the last ${days} days...\n`));
                }
                const result = await sacred.narrate(days);
                if (json) {
                    printJson(result);
                    break;
                }

                console.log(color.bold(`📖 Your Story — last ${days} day${days !== 1 ? 's' : ''}:\n`));
                console.log(result.summary);
                console.log();

                if (result.stats.topFiles.length > 0) {
                    console.log(color.bold('Files you kept returning to:'));
                    result.stats.topFiles.forEach((f, i) => {
                        console.log(color.dim(`  ${i + 1}.`) + ` ${f.file} ` + color.dim(`(${f.changes} change${f.changes !== 1 ? 's' : ''})`));
                        console.log(color.dim(`     ${f.path}`));
                    });
                    console.log();
                }
                break;
            }

            case 'experiment': {
                if (!param) {
                    console.log(color.yellow('Name your experiment.'));
                    console.log(color.dim('Example: sacred experiment "bold-new-intro"'));
                    process.exit(1);
                }
                const result = await sacred.experiment(param);
                if (json) {
                    printJson(result);
                    break;
                }
                console.log(result.success
                    ? color.green('🧪 ') + result.message
                    : color.red('✗ ') + result.message);
                break;
            }

            case 'keep': {
                const result = await sacred.keep();
                if (json) {
                    printJson(result);
                    break;
                }
                console.log(result.success
                    ? color.green('✓ ') + result.message
                    : color.yellow('○ ') + result.message);
                break;
            }

            case 'discard': {
                const result = await sacred.discard();
                if (json) {
                    printJson(result);
                    break;
                }
                console.log(result.success
                    ? color.green('🗑 ') + result.message
                    : color.yellow('○ ') + result.message);
                break;
            }

            case 'restore': {
                if (!param) {
                    console.log(color.yellow('Which moment? Provide a hash from the timeline.'));
                    console.log(color.dim('Run "sacred timeline" to see available moments.'));
                    process.exit(1);
                }
                const result = await sacred.restore(param);
                if (json) {
                    printJson(result);
                    break;
                }
                console.log(result.success
                    ? color.green('⏪ ') + result.message
                    : color.red('✗ ') + result.message);
                break;
            }

            case 'start': {
                if (isRepo) {
                    console.log(color.yellow('○ ') + 'Sacred Timeline already exists in this folder.');
                    break;
                }
                const result = await sacred.start();
                if (json) {
                    printJson(result);
                    break;
                }
                console.log(result.success
                    ? color.green('🚀 ') + result.message
                    : color.red('✗ ') + result.message);
                break;
            }

            case 'connect': {
                if (!param) {
                    console.log(color.yellow('Where to? Provide a GitHub URL.'));
                    console.log(color.dim('Example: sacred connect https://github.com/username/repo.git'));
                    process.exit(1);
                }
                const result = await sacred.connect(param);
                if (json) {
                    printJson(result);
                    break;
                }
                console.log(result.success
                    ? color.green('🔗 ') + result.message
                    : color.red('✗ ') + result.message);
                break;
            }

            case 'status': {
                const status = await sacred.getStatusSummary();
                const changes = await sacred.changes();
                if (json) {
                    printJson(await buildStatusPayload(sacred));
                    break;
                }

                console.log(color.bold('\nSacred Timeline Status:\n'));

                if (status.currentExperiment) {
                    console.log(color.yellow('🧪 Experiment: ') + status.currentExperiment);
                } else {
                    console.log(color.green('● ') + 'On main timeline');
                }

                if (changes.hasChanges) {
                    console.log(color.yellow('○ ') + `${changes.summary}`);
                } else {
                    console.log(color.green('✓ ') + 'No uncommitted changes');
                }

                if (status.aheadOfCloud > 0) {
                    console.log(color.blue('↑ ') + `${status.aheadOfCloud} capture(s) to backup`);
                }
                if (status.behindCloud > 0) {
                    console.log(color.blue('↓ ') + `${status.behindCloud} new capture(s) available`);
                }
                if (status.aheadOfCloud === 0 && status.behindCloud === 0 && !changes.hasChanges) {
                    console.log(color.green('☁ ') + 'In sync with cloud');
                }

                if (status.hasConflicts) {
                    console.log(color.red('⚠ ') + 'Has conflicts - needs untangling');
                }
                console.log();
                break;
            }

            case 'doctor': {
                const result = await buildDoctorPayload(sacred, cwd);
                if (json) {
                    printJson(result);
                    break;
                }

                console.log(color.bold('\nSacred Timeline Doctor:\n'));
                for (const check of result.checks) {
                    const icon = check.ok ? color.green('✓') : color.yellow('○');
                    console.log(`${icon} ${check.name}: ${check.detail}`);
                }

                if (result.recommendations.length > 0) {
                    console.log(color.bold('\nRecommended next steps:\n'));
                    result.recommendations.forEach(item => console.log(`  ${color.yellow('→')} ${item}`));
                } else {
                    console.log(color.green('\n✓ Sacred Timeline is ready.\n'));
                }
                break;
            }

            case 'init-shell': {
                const shellHook = `
# Sacred Timeline - auto-status on cd
sacred_auto_status() {
    if [ -d ".git" ]; then
        sacred status-line 2>/dev/null
    fi
}
cd() {
    builtin cd "$@" && sacred_auto_status
}
sacred_auto_status
`;
                // Only print the raw hook — no color codes, so it's safe to pipe to .zshrc
                process.stdout.write(shellHook);
                break;
            }

            case 'status-line': {
                // One-line status for shell integration (silent if not a repo)
                const status = await sacred.getStatusSummary();
                const changes = await sacred.changes();

                const parts: string[] = [];

                if (status.currentExperiment) {
                    parts.push(color.yellow(`🧪 ${status.currentExperiment}`));
                }

                if (changes.hasChanges) {
                    const total = changes.staged.length + changes.unstaged.length + changes.untracked.length;
                    parts.push(color.yellow(`${total} changes`));
                }

                if (status.aheadOfCloud > 0) {
                    parts.push(color.blue(`↑${status.aheadOfCloud} to backup`));
                }

                if (status.behindCloud > 0) {
                    parts.push(color.blue(`↓${status.behindCloud} available`));
                }

                if (status.hasConflicts) {
                    parts.push(color.red('⚠ conflicts'));
                }

                if (parts.length > 0) {
                    console.log(color.dim('📸 ') + parts.join(color.dim(' · ')));
                } else if (!changes.hasChanges && status.aheadOfCloud === 0) {
                    console.log(color.dim('📸 ') + color.green('✓ all synced'));
                }
                break;
            }

            default:
                console.log(color.red(`Unknown command: ${command}`));
                console.log(color.dim('Run "sacred help" for available commands.'));
                process.exit(1);
        }
    } catch (error) {
        console.log(color.red('Error: ') + (error instanceof Error ? error.message : 'Unknown error'));
        process.exit(1);
    }
}

main();
