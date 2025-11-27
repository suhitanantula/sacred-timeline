/**
 * Sacred Timeline - VS Code Extension
 *
 * Git for humans: Innovation architecture for the AI age
 *
 * Making version control accessible to non-coders through
 * human-friendly language and visual interfaces.
 */

import * as vscode from 'vscode';
import { SacredTimeline } from './git-wrapper';
import { SidebarProvider } from './sidebar-provider';

let sacredTimeline: SacredTimeline | undefined;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
    console.log('Sacred Timeline is now active');

    // Initialize the git wrapper
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

    if (workspaceRoot) {
        sacredTimeline = new SacredTimeline(workspaceRoot);
    }

    // Register sidebar provider
    const sidebarProvider = new SidebarProvider(context.extensionUri, sacredTimeline);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('sacredTimeline.mainView', sidebarProvider)
    );

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.command = 'sacredTimeline.checkpoint';
    context.subscriptions.push(statusBarItem);
    updateStatusBar();

    // Register commands
    const commands = [
        vscode.commands.registerCommand('sacredTimeline.checkpoint', checkpointCommand),
        vscode.commands.registerCommand('sacredTimeline.update', updateCommand),
        vscode.commands.registerCommand('sacredTimeline.backup', backupCommand),
        vscode.commands.registerCommand('sacredTimeline.changes', changesCommand),
        vscode.commands.registerCommand('sacredTimeline.timeline', timelineCommand),
        vscode.commands.registerCommand('sacredTimeline.experiment', experimentCommand),
        vscode.commands.registerCommand('sacredTimeline.keep', keepCommand),
        vscode.commands.registerCommand('sacredTimeline.discard', discardCommand),
        vscode.commands.registerCommand('sacredTimeline.restore', restoreCommand),
        vscode.commands.registerCommand('sacredTimeline.start', startCommand),
        vscode.commands.registerCommand('sacredTimeline.connect', connectCommand),
        vscode.commands.registerCommand('sacredTimeline.untangle', untangleCommand),
    ];

    context.subscriptions.push(...commands);

    // Watch for file changes to update status
    const watcher = vscode.workspace.createFileSystemWatcher('**/*');
    watcher.onDidChange(() => updateStatusBar());
    watcher.onDidCreate(() => updateStatusBar());
    watcher.onDidDelete(() => updateStatusBar());
    context.subscriptions.push(watcher);
}

// CHECKPOINT: Save this moment
async function checkpointCommand() {
    if (!sacredTimeline) {
        vscode.window.showErrorMessage('No workspace open');
        return;
    }

    // First check if there are changes
    const changes = await sacredTimeline.changes();
    if (!changes.hasChanges) {
        vscode.window.showInformationMessage('Nothing to checkpoint - no changes detected');
        return;
    }

    // Ask for checkpoint message
    const message = await vscode.window.showInputBox({
        prompt: 'What did you learn or accomplish?',
        placeHolder: 'e.g., "Finished draft of chapter 3" or "Fixed the navigation issue"',
        validateInput: (text) => {
            if (!text || text.trim().length === 0) {
                return 'Please describe what you accomplished';
            }
            return null;
        }
    });

    if (!message) return;

    const result = await sacredTimeline.checkpoint(message);

    if (result.success) {
        vscode.window.showInformationMessage(`$(check) ${result.message}`);
    } else {
        vscode.window.showErrorMessage(result.message);
    }

    updateStatusBar();
}

// UPDATE: Get latest from cloud
async function updateCommand() {
    if (!sacredTimeline) {
        vscode.window.showErrorMessage('No workspace open');
        return;
    }

    const result = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Updating from cloud...',
        cancellable: false
    }, async () => {
        return await sacredTimeline!.update();
    });

    if (result.success) {
        vscode.window.showInformationMessage(`$(cloud-download) ${result.message}`);
    } else {
        vscode.window.showWarningMessage(result.message);
    }

    updateStatusBar();
}

// BACKUP: Send to cloud
async function backupCommand() {
    if (!sacredTimeline) {
        vscode.window.showErrorMessage('No workspace open');
        return;
    }

    const result = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Backing up to cloud...',
        cancellable: false
    }, async () => {
        return await sacredTimeline!.backup();
    });

    if (result.success) {
        vscode.window.showInformationMessage(`$(cloud-upload) ${result.message}`);
    } else {
        vscode.window.showWarningMessage(result.message);
    }

    updateStatusBar();
}

// CHANGES: What did I change?
async function changesCommand() {
    if (!sacredTimeline) {
        vscode.window.showErrorMessage('No workspace open');
        return;
    }

    const changes = await sacredTimeline.changes();

    if (!changes.hasChanges) {
        vscode.window.showInformationMessage('No changes since last checkpoint');
        return;
    }

    // Show in a quick pick for better visibility
    const items: vscode.QuickPickItem[] = [];

    if (changes.staged.length > 0) {
        items.push({ label: '$(check) Ready to checkpoint', kind: vscode.QuickPickItemKind.Separator });
        changes.staged.forEach(f => items.push({ label: `  ${f}`, description: 'staged' }));
    }

    if (changes.unstaged.length > 0) {
        items.push({ label: '$(edit) Modified', kind: vscode.QuickPickItemKind.Separator });
        changes.unstaged.forEach(f => items.push({ label: `  ${f}`, description: 'modified' }));
    }

    if (changes.untracked.length > 0) {
        items.push({ label: '$(new-file) New files', kind: vscode.QuickPickItemKind.Separator });
        changes.untracked.forEach(f => items.push({ label: `  ${f}`, description: 'new' }));
    }

    vscode.window.showQuickPick(items, {
        title: `Changes: ${changes.summary}`,
        canPickMany: false
    });
}

// TIMELINE: Show me history
async function timelineCommand() {
    if (!sacredTimeline) {
        vscode.window.showErrorMessage('No workspace open');
        return;
    }

    const timeline = await sacredTimeline.timeline(30);

    if (timeline.length === 0) {
        vscode.window.showInformationMessage('No checkpoints yet. Create your first checkpoint!');
        return;
    }

    const items = timeline.map(entry => ({
        label: `$(git-commit) ${entry.message}`,
        description: entry.relativeDate,
        detail: `by ${entry.author}`,
        hash: entry.hash
    }));

    const selected = await vscode.window.showQuickPick(items, {
        title: 'Timeline - Your checkpoint history',
        placeHolder: 'Select a checkpoint to view or restore'
    });

    if (selected) {
        const action = await vscode.window.showQuickPick(
            ['View changes at this point', 'Restore to this point'],
            { placeHolder: `Checkpoint: ${selected.label}` }
        );

        if (action === 'Restore to this point') {
            const confirm = await vscode.window.showWarningMessage(
                'This will restore your files to this checkpoint. Continue?',
                'Yes, restore',
                'Cancel'
            );

            if (confirm === 'Yes, restore') {
                const result = await sacredTimeline.restore((selected as any).hash);
                if (result.success) {
                    vscode.window.showInformationMessage(result.message);
                } else {
                    vscode.window.showErrorMessage(result.message);
                }
            }
        }
    }
}

// EXPERIMENT: Try something risky
async function experimentCommand() {
    if (!sacredTimeline) {
        vscode.window.showErrorMessage('No workspace open');
        return;
    }

    const name = await vscode.window.showInputBox({
        prompt: 'Name your experiment',
        placeHolder: 'e.g., "new-intro" or "bold-redesign"',
        validateInput: (text) => {
            if (!text || text.trim().length === 0) {
                return 'Please name your experiment';
            }
            return null;
        }
    });

    if (!name) return;

    const result = await sacredTimeline.experiment(name);

    if (result.success) {
        vscode.window.showInformationMessage(`$(beaker) ${result.message}`);
    } else {
        vscode.window.showErrorMessage(result.message);
    }

    updateStatusBar();
}

// KEEP: Keep the experiment
async function keepCommand() {
    if (!sacredTimeline) {
        vscode.window.showErrorMessage('No workspace open');
        return;
    }

    const result = await sacredTimeline.keep();

    if (result.success) {
        vscode.window.showInformationMessage(`$(check) ${result.message}`);
    } else {
        vscode.window.showWarningMessage(result.message);
    }

    updateStatusBar();
}

// DISCARD: Abandon experiment
async function discardCommand() {
    if (!sacredTimeline) {
        vscode.window.showErrorMessage('No workspace open');
        return;
    }

    const status = await sacredTimeline.getStatusSummary();

    if (!status.currentExperiment) {
        vscode.window.showInformationMessage('You\'re on the main timeline. Nothing to discard.');
        return;
    }

    const confirm = await vscode.window.showWarningMessage(
        `Discard experiment "${status.currentExperiment}"? All changes in this experiment will be lost.`,
        'Yes, discard',
        'Cancel'
    );

    if (confirm !== 'Yes, discard') return;

    const result = await sacredTimeline.discard();

    if (result.success) {
        vscode.window.showInformationMessage(`$(trash) ${result.message}`);
    } else {
        vscode.window.showErrorMessage(result.message);
    }

    updateStatusBar();
}

// RESTORE: Go back to earlier
async function restoreCommand() {
    // This is handled through the timeline command for better UX
    await timelineCommand();
}

// START: Begin fresh project
async function startCommand() {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

    if (!workspaceRoot) {
        vscode.window.showErrorMessage('Please open a folder first');
        return;
    }

    if (!sacredTimeline) {
        sacredTimeline = new SacredTimeline(workspaceRoot);
    }

    const isRepo = await sacredTimeline.isRepository();

    if (isRepo) {
        vscode.window.showInformationMessage('Sacred Timeline already initialized in this folder');
        return;
    }

    const result = await sacredTimeline.start();

    if (result.success) {
        vscode.window.showInformationMessage(`$(rocket) ${result.message}`);
    } else {
        vscode.window.showErrorMessage(result.message);
    }

    updateStatusBar();
}

// CONNECT: Link to cloud
async function connectCommand() {
    if (!sacredTimeline) {
        vscode.window.showErrorMessage('No workspace open');
        return;
    }

    const url = await vscode.window.showInputBox({
        prompt: 'Enter your GitHub repository URL',
        placeHolder: 'https://github.com/username/repository.git',
        validateInput: (text) => {
            if (!text || !text.includes('github.com')) {
                return 'Please enter a valid GitHub URL';
            }
            return null;
        }
    });

    if (!url) return;

    const result = await sacredTimeline.connect(url);

    if (result.success) {
        vscode.window.showInformationMessage(`$(plug) ${result.message}`);
    } else {
        vscode.window.showWarningMessage(result.message);
    }

    updateStatusBar();
}

// UNTANGLE: Fix conflicts
async function untangleCommand() {
    // For now, open the built-in git merge editor
    vscode.commands.executeCommand('git.openMergeEditor');
}

// Update status bar
async function updateStatusBar() {
    if (!sacredTimeline) {
        statusBarItem.hide();
        return;
    }

    const status = await sacredTimeline.getStatusSummary();

    if (!status.isRepo) {
        statusBarItem.text = '$(rocket) Start Timeline';
        statusBarItem.tooltip = 'Initialize Sacred Timeline for this project';
        statusBarItem.command = 'sacredTimeline.start';
        statusBarItem.show();
        return;
    }

    const parts: string[] = [];

    // Show experiment name if on one
    if (status.currentExperiment) {
        parts.push(`$(beaker) ${status.currentExperiment}`);
    } else {
        parts.push('$(git-branch) main');
    }

    // Show change indicator
    if (status.hasChanges) {
        parts.push('$(circle-filled)');
    }

    // Show sync status
    if (status.behindCloud > 0) {
        parts.push(`$(cloud-download) ${status.behindCloud}`);
    }
    if (status.aheadOfCloud > 0) {
        parts.push(`$(cloud-upload) ${status.aheadOfCloud}`);
    }

    // Show conflict indicator
    if (status.hasConflicts) {
        parts.push('$(warning) Tangles');
    }

    statusBarItem.text = parts.join(' ');
    statusBarItem.tooltip = status.hasChanges
        ? 'You have changes. Click to checkpoint.'
        : 'Sacred Timeline - All synced';
    statusBarItem.show();
}

export function deactivate() {
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}
