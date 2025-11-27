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
};

function getHelpText(): string {
    return `
${color.bold('Sacred Timeline')} - Git for humans

${color.dim('Commands:')}
  ${color.green('capture')} "message"     Save this moment with a description
  ${color.green('update')}               Get latest from cloud
  ${color.green('backup')}               Send to cloud
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

            case 'update': {
                console.log(color.dim('Updating from cloud...'));
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
                const entries = await sacred.timeline(15);
                if (entries.length === 0) {
                    console.log(color.dim('No captures yet. Create your first with: sacred capture "your message"'));
                } else {
                    console.log(color.bold('\nTimeline:\n'));
                    entries.forEach((entry, i) => {
                        const dot = i === 0 ? color.green('●') : color.dim('○');
                        const hash = color.dim(entry.shortHash);
                        const msg = entry.message.length > 60
                            ? entry.message.substring(0, 57) + '...'
                            : entry.message;
                        const time = color.dim(`(${entry.relativeDate})`);
                        console.log(`  ${dot} ${hash} ${msg} ${time}`);
                    });
                    console.log();
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
                    console.log(color.blue('↓ ') + `${status.behindCloud} capture(s) to update`);
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
                    parts.push(color.blue(`↓${status.behindCloud} to update`));
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
