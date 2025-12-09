/**
 * Sacred Timeline - Git Wrapper
 *
 * Translates human-friendly innovation language to git commands.
 *
 * The Language:
 *   checkpoint  → git add . && git commit -m "message"
 *   update      → git pull
 *   backup      → git push
 *   changes     → git diff + git status
 *   timeline    → git log (visual)
 *   experiment  → git checkout -b "name"
 *   keep        → git merge
 *   discard     → git branch -d
 *   restore     → git checkout
 *   start       → git init
 *   connect     → git remote add origin
 *   untangle    → merge conflict resolution helper
 */

import simpleGit, { SimpleGit, StatusResult, LogResult, DiffResult } from 'simple-git';
import * as path from 'path';

export interface CaptureResult {
    success: boolean;
    message: string;
    hash?: string;
}

export interface UpdateResult {
    success: boolean;
    message: string;
    behind?: number;
    ahead?: number;
}

export interface BackupResult {
    success: boolean;
    message: string;
    pushed?: boolean;
}

export interface WorktreeInfo {
    path: string;
    branch: string;
    name: string;
}

export interface BackupAllResult {
    success: boolean;
    message: string;
    results: { name: string; branch: string; success: boolean; message: string }[];
}

export interface ChangesResult {
    hasChanges: boolean;
    staged: string[];
    unstaged: string[];
    untracked: string[];
    summary: string;
}

export interface TimelineEntry {
    hash: string;
    shortHash: string;
    message: string;
    author: string;
    date: Date;
    relativeDate: string;
}

export interface ExperimentResult {
    success: boolean;
    message: string;
    experimentName?: string;
}

export class SacredTimeline {
    private git: SimpleGit;
    private workspaceRoot: string;

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
        this.git = simpleGit(workspaceRoot);
    }

    /**
     * CAPTURE: Save this moment
     * "I tried something and here's what I learned"
     */
    async capture(message: string): Promise<CaptureResult> {
        try {
            // Check if there are any changes to capture
            const status = await this.git.status();

            if (status.files.length === 0) {
                return {
                    success: false,
                    message: 'Nothing to capture - no changes detected'
                };
            }

            // Add all changes
            await this.git.add('.');

            // Create the capture (commit)
            const result = await this.git.commit(message);

            return {
                success: true,
                message: `Captured: "${message}"`,
                hash: result.commit
            };
        } catch (error) {
            return {
                success: false,
                message: `Capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    /**
     * UPDATE: Get latest from cloud
     * "Bringing the latest collective thinking into my work"
     */
    async update(): Promise<UpdateResult> {
        try {
            // Check if we have a remote configured
            const remotes = await this.git.getRemotes(true);

            if (remotes.length === 0) {
                return {
                    success: false,
                    message: 'Not connected to cloud yet. Use "Connect" first.'
                };
            }

            // Fetch first to see what's available
            await this.git.fetch();

            // Get status to check if we're behind
            const status = await this.git.status();

            if (status.behind === 0) {
                return {
                    success: true,
                    message: 'Already up to date!',
                    behind: 0,
                    ahead: status.ahead
                };
            }

            // Pull the changes
            await this.git.pull();

            return {
                success: true,
                message: `Updated! Got ${status.behind} new capture(s) from cloud.`,
                behind: status.behind,
                ahead: status.ahead
            };
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';

            // Check for common issues
            if (errorMsg.includes('conflict')) {
                return {
                    success: false,
                    message: 'Update found tangles (conflicts). Use "Untangle" to resolve.'
                };
            }

            return {
                success: false,
                message: `Update failed: ${errorMsg}`
            };
        }
    }

    /**
     * BACKUP: Send to cloud
     * "Sharing my learning into the organization's co-intelligent universe"
     */
    async backup(): Promise<BackupResult> {
        try {
            // Check if we have a remote configured
            const remotes = await this.git.getRemotes(true);

            if (remotes.length === 0) {
                return {
                    success: false,
                    message: 'Not connected to cloud yet. Use "Connect" first.'
                };
            }

            // Check if there's anything to push
            const status = await this.git.status();

            if (status.ahead === 0) {
                return {
                    success: true,
                    message: 'Already backed up! Cloud is in sync.',
                    pushed: false
                };
            }

            // Push to remote
            await this.git.push();

            return {
                success: true,
                message: `Backed up! ${status.ahead} capture(s) sent to cloud.`,
                pushed: true
            };
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';

            // Check for common issues
            if (errorMsg.includes('rejected')) {
                return {
                    success: false,
                    message: 'Backup rejected - cloud has newer changes. Run "Update" first.'
                };
            }

            return {
                success: false,
                message: `Backup failed: ${errorMsg}`
            };
        }
    }

    /**
     * Get list of worktrees for this repository
     */
    async getWorktrees(): Promise<WorktreeInfo[]> {
        try {
            const result = await this.git.raw(['worktree', 'list', '--porcelain']);
            const worktrees: WorktreeInfo[] = [];

            const blocks = result.trim().split('\n\n');
            for (const block of blocks) {
                const lines = block.split('\n');
                let worktreePath = '';
                let branch = '';

                for (const line of lines) {
                    if (line.startsWith('worktree ')) {
                        worktreePath = line.substring(9);
                    } else if (line.startsWith('branch ')) {
                        // Branch format: refs/heads/branch-name
                        branch = line.substring(7).replace('refs/heads/', '');
                    }
                }

                if (worktreePath && branch) {
                    const name = worktreePath.split('/').pop() || worktreePath;
                    worktrees.push({ path: worktreePath, branch, name });
                }
            }

            return worktrees;
        } catch {
            return [];
        }
    }

    /**
     * BACKUP-ALL: Backup current repo and all worktrees
     * Commits any pending changes and pushes each worktree's branch
     */
    async backupAll(): Promise<BackupAllResult> {
        const results: { name: string; branch: string; success: boolean; message: string }[] = [];

        try {
            // Check if we have a remote configured
            const remotes = await this.git.getRemotes(true);
            if (remotes.length === 0) {
                return {
                    success: false,
                    message: 'Not connected to cloud yet. Use "Connect" first.',
                    results: []
                };
            }

            // Get all worktrees
            const worktrees = await this.getWorktrees();

            if (worktrees.length === 0) {
                // No worktrees, just do regular backup
                const result = await this.backup();
                return {
                    success: result.success,
                    message: result.message,
                    results: []
                };
            }

            // Process each worktree
            for (const wt of worktrees) {
                try {
                    const wtGit = simpleGit(wt.path);

                    // Check for uncommitted changes
                    const status = await wtGit.status();

                    // Auto-commit if there are changes
                    if (status.files.length > 0) {
                        await wtGit.add('.');
                        const timestamp = new Date().toISOString().split('T')[0] + ' ' +
                                         new Date().toTimeString().split(' ')[0].substring(0, 5);
                        await wtGit.commit(`Backup ${timestamp}`);
                    }

                    // Push the branch
                    const pushStatus = await wtGit.status();
                    if (pushStatus.ahead > 0) {
                        await wtGit.push('origin', wt.branch);
                        results.push({
                            name: wt.name,
                            branch: wt.branch,
                            success: true,
                            message: `Pushed ${pushStatus.ahead} capture(s)`
                        });
                    } else {
                        results.push({
                            name: wt.name,
                            branch: wt.branch,
                            success: true,
                            message: 'Already in sync'
                        });
                    }
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                    results.push({
                        name: wt.name,
                        branch: wt.branch,
                        success: false,
                        message: errorMsg.includes('rejected')
                            ? 'Needs update first'
                            : `Failed: ${errorMsg.substring(0, 50)}`
                    });
                }
            }

            const successCount = results.filter(r => r.success).length;
            const failCount = results.filter(r => !r.success).length;

            return {
                success: failCount === 0,
                message: failCount === 0
                    ? `All ${successCount} worktree(s) backed up!`
                    : `${successCount} succeeded, ${failCount} failed`,
                results
            };
        } catch (error) {
            return {
                success: false,
                message: `Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                results
            };
        }
    }

    /**
     * CHANGES: What did I change?
     * Shows current modifications in human-friendly format
     */
    async changes(): Promise<ChangesResult> {
        try {
            const status = await this.git.status();

            const staged = status.staged;
            const unstaged = status.modified.filter(f => !status.staged.includes(f));
            const untracked = status.not_added;

            const hasChanges = staged.length > 0 || unstaged.length > 0 || untracked.length > 0;

            let summary = '';
            if (!hasChanges) {
                summary = 'No changes since last capture.';
            } else {
                const parts = [];
                if (staged.length > 0) parts.push(`${staged.length} ready to capture`);
                if (unstaged.length > 0) parts.push(`${unstaged.length} modified`);
                if (untracked.length > 0) parts.push(`${untracked.length} new`);
                summary = parts.join(', ');
            }

            return {
                hasChanges,
                staged,
                unstaged,
                untracked,
                summary
            };
        } catch (error) {
            return {
                hasChanges: false,
                staged: [],
                unstaged: [],
                untracked: [],
                summary: `Could not check changes: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    /**
     * TIMELINE: Show me history
     * Visual representation of the sacred timeline
     */
    async timeline(limit: number = 20): Promise<TimelineEntry[]> {
        try {
            const log = await this.git.log({ maxCount: limit });

            return log.all.map(entry => ({
                hash: entry.hash,
                shortHash: entry.hash.substring(0, 7),
                message: entry.message,
                author: entry.author_name,
                date: new Date(entry.date),
                relativeDate: this.getRelativeDate(new Date(entry.date))
            }));
        } catch (error) {
            return [];
        }
    }

    /**
     * EXPERIMENT: Try something risky
     * "Starting a new experiment" - creates a branch
     */
    async experiment(name: string): Promise<ExperimentResult> {
        try {
            // Sanitize the experiment name
            const safeName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');

            await this.git.checkoutLocalBranch(safeName);

            return {
                success: true,
                message: `Experiment "${name}" started. You're now on a safe branch.`,
                experimentName: safeName
            };
        } catch (error) {
            return {
                success: false,
                message: `Could not start experiment: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    /**
     * KEEP: Keep the experiment
     * Merges experiment back to main timeline
     */
    async keep(): Promise<{ success: boolean; message: string }> {
        try {
            const status = await this.git.status();
            const currentBranch = status.current;

            if (currentBranch === 'main' || currentBranch === 'master') {
                return {
                    success: false,
                    message: 'You\'re already on the main timeline. Nothing to keep.'
                };
            }

            // Switch to main and merge
            const mainBranch = await this.getMainBranch();
            await this.git.checkout(mainBranch);
            await this.git.merge([currentBranch!]);

            // Delete the experiment branch
            await this.git.deleteLocalBranch(currentBranch!);

            return {
                success: true,
                message: `Experiment "${currentBranch}" is now part of the main timeline!`
            };
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';

            if (errorMsg.includes('conflict')) {
                return {
                    success: false,
                    message: 'Keeping this experiment created tangles. Use "Untangle" to resolve.'
                };
            }

            return {
                success: false,
                message: `Could not keep experiment: ${errorMsg}`
            };
        }
    }

    /**
     * DISCARD: Abandon experiment
     * Deletes the experiment branch
     */
    async discard(): Promise<{ success: boolean; message: string }> {
        try {
            const status = await this.git.status();
            const currentBranch = status.current;

            if (currentBranch === 'main' || currentBranch === 'master') {
                return {
                    success: false,
                    message: 'You\'re on the main timeline. Nothing to discard.'
                };
            }

            // Switch to main first
            const mainBranch = await this.getMainBranch();
            await this.git.checkout(mainBranch);

            // Force delete the experiment branch
            await this.git.deleteLocalBranch(currentBranch!, true);

            return {
                success: true,
                message: `Experiment "${currentBranch}" discarded. Back on main timeline.`
            };
        } catch (error) {
            return {
                success: false,
                message: `Could not discard experiment: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    /**
     * RESTORE: Go back to earlier
     * Time travel to a previous capture
     */
    async restore(hashOrRelative: string): Promise<{ success: boolean; message: string }> {
        try {
            // Check for uncommitted changes first
            const status = await this.git.status();
            if (status.files.length > 0) {
                return {
                    success: false,
                    message: 'You have unsaved changes. Capture them first, or they\'ll be lost.'
                };
            }

            await this.git.checkout(hashOrRelative);

            return {
                success: true,
                message: `Restored to capture ${hashOrRelative.substring(0, 7)}`
            };
        } catch (error) {
            return {
                success: false,
                message: `Could not restore: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    /**
     * START: Begin fresh project
     * Initializes a new git repository
     */
    async start(): Promise<{ success: boolean; message: string }> {
        try {
            await this.git.init();

            return {
                success: true,
                message: 'Sacred Timeline initialized! Your innovation journey begins.'
            };
        } catch (error) {
            return {
                success: false,
                message: `Could not start: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    /**
     * CONNECT: Link to cloud
     * Sets up remote repository
     */
    async connect(url: string): Promise<{ success: boolean; message: string }> {
        try {
            // Check if origin already exists
            const remotes = await this.git.getRemotes();
            const hasOrigin = remotes.some(r => r.name === 'origin');

            if (hasOrigin) {
                // Update existing remote
                await this.git.removeRemote('origin');
            }

            await this.git.addRemote('origin', url);

            return {
                success: true,
                message: 'Connected to cloud! You can now backup and update.'
            };
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';

            return {
                success: false,
                message: `Could not connect: ${errorMsg}`
            };
        }
    }

    /**
     * Configure git credentials for HTTPS authentication
     * Embeds token in the remote URL for password-less push/pull
     */
    async configureCredentials(username: string, token: string): Promise<{ success: boolean; message: string }> {
        try {
            // Configure credential helper to store
            await this.git.addConfig('credential.helper', 'store');

            // Set the username for commits
            await this.git.addConfig('user.name', username);

            // Get current remote URL and update with embedded token
            const remotes = await this.git.getRemotes(true);
            const origin = remotes.find(r => r.name === 'origin');

            if (origin && origin.refs.push) {
                const url = origin.refs.push;
                // Convert https://github.com/user/repo.git to https://user:token@github.com/user/repo.git
                const authedUrl = url.replace('https://github.com/', `https://${username}:${token}@github.com/`);
                await this.git.removeRemote('origin');
                await this.git.addRemote('origin', authedUrl);
            }

            return {
                success: true,
                message: 'Credentials configured.'
            };
        } catch (error) {
            return {
                success: false,
                message: `Could not configure credentials: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    /**
     * Check if connected to a remote
     */
    async isConnected(): Promise<boolean> {
        try {
            const remotes = await this.git.getRemotes();
            return remotes.length > 0;
        } catch {
            return false;
        }
    }

    /**
     * Check if this is a git repository
     */
    async isRepository(): Promise<boolean> {
        try {
            await this.git.status();
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get current status summary for UI
     */
    async getStatusSummary(): Promise<{
        isRepo: boolean;
        currentExperiment: string | null;
        hasChanges: boolean;
        aheadOfCloud: number;
        behindCloud: number;
        hasConflicts: boolean;
    }> {
        try {
            const status = await this.git.status();
            const mainBranch = await this.getMainBranch();

            return {
                isRepo: true,
                currentExperiment: (status.current !== mainBranch) ? status.current : null,
                hasChanges: status.files.length > 0,
                aheadOfCloud: status.ahead,
                behindCloud: status.behind,
                hasConflicts: status.conflicted.length > 0
            };
        } catch {
            return {
                isRepo: false,
                currentExperiment: null,
                hasChanges: false,
                aheadOfCloud: 0,
                behindCloud: 0,
                hasConflicts: false
            };
        }
    }

    /**
     * NARRATE: Summarize progress in plain English
     * "In the last week, you made 12 captures..."
     */
    async narrate(days: number = 7): Promise<{
        success: boolean;
        summary: string;
        stats: {
            totalCaptures: number;
            activeDays: number;
            topFiles: { file: string; path: string; changes: number }[];
            experiments: { started: number; kept: number; discarded: number };
            busiestDay: { day: string; captures: number } | null;
        };
    }> {
        try {
            const since = new Date();
            since.setDate(since.getDate() - days);
            const sinceStr = since.toISOString().split('T')[0];

            // Get commits in date range
            const log = await this.git.log({ '--since': sinceStr });
            const commits = log.all;

            if (commits.length === 0) {
                return {
                    success: true,
                    summary: `No captures in the last ${days} days. Time to get back to work!`,
                    stats: {
                        totalCaptures: 0,
                        activeDays: 0,
                        topFiles: [],
                        experiments: { started: 0, kept: 0, discarded: 0 },
                        busiestDay: null
                    }
                };
            }

            // Analyze commits by day
            const dayMap: { [key: string]: number } = {};
            const fileChanges: { [key: string]: number } = {};

            for (const commit of commits) {
                // Count by day
                const day = new Date(commit.date).toLocaleDateString('en-US', { weekday: 'long' });
                dayMap[day] = (dayMap[day] || 0) + 1;

                // Get files changed in this commit
                try {
                    const diff = await this.git.diff([`${commit.hash}^`, commit.hash, '--name-only']);
                    const files = diff.split('\n').filter(f => f.trim());
                    files.forEach(file => {
                        fileChanges[file] = (fileChanges[file] || 0) + 1;
                    });
                } catch {
                    // First commit won't have parent, skip
                }
            }

            // Find busiest day
            let busiestDay: { day: string; captures: number } | null = null;
            for (const [day, count] of Object.entries(dayMap)) {
                if (!busiestDay || count > busiestDay.captures) {
                    busiestDay = { day, captures: count };
                }
            }

            // Get top 5 most changed files (filter out system files)
            const topFiles = Object.entries(fileChanges)
                .filter(([file]) => !file.includes('.DS_Store') && !file.startsWith('.'))
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([file, changes]) => ({
                    file: file.split('/').pop() || file,
                    path: file,
                    changes
                }));

            // Count active days
            const uniqueDates = new Set(commits.map(c => new Date(c.date).toDateString()));
            const activeDays = uniqueDates.size;

            // Build narrative summary
            let summary = `In the last ${days} days, you made ${commits.length} capture${commits.length !== 1 ? 's' : ''}.`;

            if (busiestDay && busiestDay.captures > 1) {
                summary += ` Your most productive day was ${busiestDay.day} with ${busiestDay.captures} captures.`;
            }

            if (topFiles.length > 0) {
                const topFile = topFiles[0];
                summary += ` You worked most on "${topFile.file}" (${topFile.changes} change${topFile.changes !== 1 ? 's' : ''}).`;
            }

            if (activeDays < days / 2) {
                summary += ` You were active on ${activeDays} day${activeDays !== 1 ? 's' : ''} - consider more consistent capturing.`;
            }

            // Look for recent milestones in commit messages
            const recentMilestones = commits
                .filter(c => c.message.toLowerCase().includes('finish') ||
                            c.message.toLowerCase().includes('complete') ||
                            c.message.toLowerCase().includes('done'))
                .slice(0, 2);

            if (recentMilestones.length > 0) {
                summary += ` Recent milestones: "${recentMilestones[0].message}"`;
                if (recentMilestones.length > 1) {
                    summary += ` and "${recentMilestones[1].message}"`;
                }
                summary += '.';
            }

            return {
                success: true,
                summary,
                stats: {
                    totalCaptures: commits.length,
                    activeDays,
                    topFiles,
                    experiments: { started: 0, kept: 0, discarded: 0 }, // TODO: track branch activity
                    busiestDay
                }
            };
        } catch (error) {
            return {
                success: false,
                summary: `Could not narrate: ${error instanceof Error ? error.message : 'Unknown error'}`,
                stats: {
                    totalCaptures: 0,
                    activeDays: 0,
                    topFiles: [],
                    experiments: { started: 0, kept: 0, discarded: 0 },
                    busiestDay: null
                }
            };
        }
    }

    // Helper methods

    private async getMainBranch(): Promise<string> {
        try {
            const branches = await this.git.branchLocal();
            if (branches.all.includes('main')) return 'main';
            if (branches.all.includes('master')) return 'master';
            return 'main';
        } catch {
            return 'main';
        }
    }

    private getRelativeDate(date: Date): string {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        return date.toLocaleDateString();
    }
}
