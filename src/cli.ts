#!/usr/bin/env node
/**
 * Sacred Timeline CLI
 * Git for humans - command line edition
 */

import { SacredTimeline } from './git-wrapper';

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
  ${color.green('init-shell')}           Setup auto-status on cd (add to .zshrc)

${color.dim('Examples:')}
  sacred capture "finished draft of chapter 3"
  sacred experiment "bold-new-intro"
  sacred narrate
  sacred narrate 30
  sacred timeline
`;
}

async function main() {
    const args = process.argv.slice(2);
    const command = args[0]?.toLowerCase();
    const param = args.slice(1).join(' ');

    if (!command || command === 'help' || command === '--help' || command === '-h') {
        console.log(getHelpText());
        process.exit(0);
    }

    const cwd = process.cwd();
    const sacred = new SacredTimeline(cwd);

    // Check if this is a git repo for most commands
    const isRepo = await sacred.isRepository();
    if (!isRepo && !['start', 'help'].includes(command)) {
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
                console.log(result.success
                    ? color.green('📸 ') + result.message
                    : color.yellow('○ ') + result.message);
                break;
            }

            case 'latest': {
                console.log(color.dim('Getting the latest from cloud...'));
                const result = await sacred.update();
                console.log(result.success
                    ? color.green('✓ ') + result.message
                    : color.yellow('○ ') + result.message);
                break;
            }

            case 'backup': {
                console.log(color.dim('Backing up to cloud...'));
                const result = await sacred.backup();
                console.log(result.success
                    ? color.green('☁ ') + result.message
                    : color.yellow('○ ') + result.message);
                break;
            }

            case 'backup-all': {
                console.log(color.dim('Backing up all worktrees...\n'));
                const result = await sacred.backupAll();

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
                console.log(color.dim(`Analyzing the last ${days} days...\n`));
                const result = await sacred.narrate(days);

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
                break;
            }

            case 'experiment': {
                if (!param) {
                    console.log(color.yellow('Name your experiment.'));
                    console.log(color.dim('Example: sacred experiment "bold-new-intro"'));
                    process.exit(1);
                }
                const result = await sacred.experiment(param);
                console.log(result.success
                    ? color.green('🧪 ') + result.message
                    : color.red('✗ ') + result.message);
                break;
            }

            case 'keep': {
                const result = await sacred.keep();
                console.log(result.success
                    ? color.green('✓ ') + result.message
                    : color.yellow('○ ') + result.message);
                break;
            }

            case 'discard': {
                const result = await sacred.discard();
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
                console.log(result.success
                    ? color.green('🔗 ') + result.message
                    : color.red('✗ ') + result.message);
                break;
            }

            case 'status': {
                const status = await sacred.getStatusSummary();
                const changes = await sacred.changes();

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

            case 'init-shell': {
                const shellHook = `
# Sacred Timeline - auto-status on cd
# Add this to your ~/.zshrc or ~/.bashrc

sacred_auto_status() {
    if [ -d ".git" ]; then
        sacred status-line 2>/dev/null
    fi
}

# Override cd to show status when entering git repos
cd() {
    builtin cd "$@" && sacred_auto_status
}

# Show status on new terminal if already in a git repo
sacred_auto_status
`;
                console.log(color.bold('\nSacred Timeline Shell Integration\n'));
                console.log(color.dim('Add this to your ~/.zshrc (or ~/.bashrc):'));
                console.log(color.dim('─'.repeat(50)));
                console.log(shellHook);
                console.log(color.dim('─'.repeat(50)));
                console.log(color.dim('\nQuick setup:'));
                console.log(color.green('  sacred init-shell >> ~/.zshrc && source ~/.zshrc'));
                console.log();
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
