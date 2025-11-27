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

import * as vscode from 'vscode';
import simpleGit, { SimpleGit, StatusResult, LogResult, DiffResult } from 'simple-git';
import * as path from 'path';

export interface CheckpointResult {
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
     * CHECKPOINT: Save this moment
     * "I tried something and here's what I learned"
     */
    async checkpoint(message: string): Promise<CheckpointResult> {
        try {
            // Check if there are any changes to checkpoint
            const status = await this.git.status();

            if (status.files.length === 0) {
                return {
                    success: false,
                    message: 'Nothing to checkpoint - no changes detected'
                };
            }

            // Add all changes
            await this.git.add('.');

            // Create the checkpoint (commit)
            const result = await this.git.commit(message);

            return {
                success: true,
                message: `Checkpoint created: "${message}"`,
                hash: result.commit
            };
        } catch (error) {
            return {
                success: false,
                message: `Checkpoint failed: ${error instanceof Error ? error.message : 'Unknown error'}`
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
                message: `Updated! Got ${status.behind} new checkpoint(s) from cloud.`,
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
                message: `Backed up! ${status.ahead} checkpoint(s) sent to cloud.`,
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
                summary = 'No changes since last checkpoint.';
            } else {
                const parts = [];
                if (staged.length > 0) parts.push(`${staged.length} ready to checkpoint`);
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
     * Time travel to a previous checkpoint
     */
    async restore(hashOrRelative: string): Promise<{ success: boolean; message: string }> {
        try {
            // Check for uncommitted changes first
            const status = await this.git.status();
            if (status.files.length > 0) {
                return {
                    success: false,
                    message: 'You have unsaved changes. Checkpoint them first, or they\'ll be lost.'
                };
            }

            await this.git.checkout(hashOrRelative);

            return {
                success: true,
                message: `Restored to checkpoint ${hashOrRelative.substring(0, 7)}`
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
            await this.git.addRemote('origin', url);

            return {
                success: true,
                message: 'Connected to cloud! You can now backup and update.'
            };
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';

            if (errorMsg.includes('already exists')) {
                return {
                    success: false,
                    message: 'Already connected to cloud.'
                };
            }

            return {
                success: false,
                message: `Could not connect: ${errorMsg}`
            };
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
