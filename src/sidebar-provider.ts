/**
 * Sacred Timeline - Sidebar Provider
 *
 * Visual interface for non-coders to interact with version control
 */

import * as vscode from 'vscode';
import { SacredTimeline } from './git-wrapper';

export class SidebarProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _sacredTimeline?: SacredTimeline
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'capture':
                    vscode.commands.executeCommand('sacredTimeline.capture');
                    break;
                case 'latest':
                    vscode.commands.executeCommand('sacredTimeline.latest');
                    break;
                case 'backup':
                    vscode.commands.executeCommand('sacredTimeline.backup');
                    break;
                case 'changes':
                    vscode.commands.executeCommand('sacredTimeline.changes');
                    break;
                case 'timeline':
                    vscode.commands.executeCommand('sacredTimeline.timeline');
                    break;
                case 'narrate':
                    vscode.commands.executeCommand('sacredTimeline.narrate');
                    break;
                case 'experiment':
                    vscode.commands.executeCommand('sacredTimeline.experiment');
                    break;
                case 'connect':
                    vscode.commands.executeCommand('sacredTimeline.connect');
                    break;
                case 'start':
                    vscode.commands.executeCommand('sacredTimeline.start');
                    break;
                case 'refresh':
                    this._updateView();
                    break;
            }
        });

        // Initial update
        this._updateView();
    }

    private async _updateView() {
        if (!this._view || !this._sacredTimeline) return;

        const status = await this._sacredTimeline.getStatusSummary();
        const changes = await this._sacredTimeline.changes();
        const timeline = await this._sacredTimeline.timeline(5);
        const isConnected = await this._sacredTimeline.isConnected();

        this._view.webview.postMessage({
            type: 'update',
            status,
            changes,
            timeline,
            isConnected
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sacred Timeline</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            padding: 12px;
        }

        .header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid var(--vscode-widget-border);
        }

        .header h2 {
            font-size: 14px;
            font-weight: 600;
        }

        .status-badge {
            font-size: 11px;
            padding: 2px 8px;
            border-radius: 10px;
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
        }

        .status-badge.changes {
            background: var(--vscode-inputValidation-warningBackground);
        }

        .status-badge.synced {
            background: var(--vscode-inputValidation-infoBackground);
        }

        .section {
            margin-bottom: 20px;
        }

        .section-title {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 8px;
            letter-spacing: 0.5px;
        }

        .button-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
        }

        .button-grid.single {
            grid-template-columns: 1fr;
        }

        button {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 10px 12px;
            border: none;
            border-radius: 4px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            cursor: pointer;
            font-size: 12px;
            transition: background 0.15s;
        }

        button:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }

        button.primary {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            grid-column: span 2;
        }

        button.primary:hover {
            background: var(--vscode-button-hoverBackground);
        }

        button .icon {
            font-size: 14px;
        }

        .changes-list {
            background: var(--vscode-editor-background);
            border-radius: 4px;
            padding: 8px;
            max-height: 120px;
            overflow-y: auto;
        }

        .change-item {
            font-size: 11px;
            padding: 4px 0;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .change-item .indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
        }

        .change-item .indicator.new {
            background: var(--vscode-gitDecoration-untrackedResourceForeground);
        }

        .change-item .indicator.modified {
            background: var(--vscode-gitDecoration-modifiedResourceForeground);
        }

        .timeline-list {
            background: var(--vscode-editor-background);
            border-radius: 4px;
            padding: 8px;
            position: relative;
        }

        .timeline-item {
            padding: 8px 0 8px 20px;
            border-left: 2px solid var(--vscode-widget-border);
            margin-left: 6px;
            position: relative;
        }

        .timeline-item::before {
            content: '';
            position: absolute;
            left: -6px;
            top: 12px;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: var(--vscode-button-background);
            border: 2px solid var(--vscode-editor-background);
        }

        .timeline-item:last-child {
            border-left-color: transparent;
        }

        .timeline-item:first-child::before {
            background: var(--vscode-gitDecoration-addedResourceForeground);
        }

        .timeline-message {
            font-size: 12px;
            margin-bottom: 4px;
            line-height: 1.4;
        }

        .timeline-meta {
            font-size: 10px;
            color: var(--vscode-descriptionForeground);
            display: flex;
            gap: 8px;
        }

        .timeline-meta .author {
            opacity: 0.8;
        }

        .empty-state {
            text-align: center;
            padding: 20px;
            color: var(--vscode-descriptionForeground);
            font-size: 12px;
        }

        .experiment-banner {
            background: var(--vscode-inputValidation-warningBackground);
            padding: 8px 12px;
            border-radius: 4px;
            margin-bottom: 12px;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .keyboard-hint {
            font-size: 10px;
            color: var(--vscode-descriptionForeground);
            text-align: center;
            margin-top: 12px;
        }

        kbd {
            background: var(--vscode-keybindingKey-background);
            border: 1px solid var(--vscode-keybindingKey-border);
            border-radius: 3px;
            padding: 1px 4px;
            font-family: monospace;
            font-size: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>Sacred Timeline</h2>
        <span class="status-badge" id="statusBadge">Loading...</span>
    </div>

    <div id="experimentBanner" class="experiment-banner" style="display: none;">
        <span>🧪</span>
        <span>Experiment: <strong id="experimentName"></strong></span>
    </div>

    <div class="section">
        <div class="section-title">Quick Actions</div>
        <div class="button-grid">
            <button class="primary" onclick="sendMessage('capture')">
                <span class="icon">📸</span>
                Capture
            </button>
            <button onclick="sendMessage('latest')">
                <span class="icon">⬇️</span>
                Latest
            </button>
            <button onclick="sendMessage('backup')">
                <span class="icon">☁️</span>
                Backup
            </button>
        </div>
    </div>

    <div class="section" id="changesSection" style="display: none;">
        <div class="section-title">Changes</div>
        <div class="changes-list" id="changesList"></div>
    </div>

    <div class="section">
        <div class="section-title">Recent Timeline</div>
        <div class="timeline-list" id="timelineList">
            <div class="empty-state">No captures yet</div>
        </div>
        <div class="button-grid" style="margin-top: 8px;">
            <button onclick="sendMessage('timeline')">
                <span class="icon">📜</span>
                Full Timeline
            </button>
            <button onclick="sendMessage('narrate')">
                <span class="icon">📖</span>
                Narrate
            </button>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Experiments</div>
        <div class="button-grid single">
            <button onclick="sendMessage('experiment')">
                <span class="icon">🧪</span>
                Start New Experiment
            </button>
        </div>
    </div>

    <div class="section" id="setupSection">
        <div class="section-title">Setup</div>
        <div class="button-grid">
            <button onclick="sendMessage('start')" id="startBtn">
                <span class="icon">🚀</span>
                Start
            </button>
            <button onclick="sendMessage('connect')" id="connectBtn">
                <span class="icon">🔗</span>
                Connect
            </button>
        </div>
    </div>

    <div class="keyboard-hint">
        <kbd>Cmd+Shift+S</kbd> Capture &nbsp;
        <kbd>Cmd+Shift+L</kbd> Latest &nbsp;
        <kbd>Cmd+Shift+B</kbd> Backup
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        function sendMessage(type) {
            vscode.postMessage({ type });
        }

        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;

            if (message.type === 'update') {
                updateUI(message);
            }
        });

        function updateUI(data) {
            const { status, changes, timeline, isConnected } = data;

            // Update status badge
            const badge = document.getElementById('statusBadge');
            if (changes.hasChanges) {
                badge.textContent = changes.summary;
                badge.className = 'status-badge changes';
            } else {
                badge.textContent = 'All synced';
                badge.className = 'status-badge synced';
            }

            // Update experiment banner
            const banner = document.getElementById('experimentBanner');
            const expName = document.getElementById('experimentName');
            if (status.currentExperiment) {
                banner.style.display = 'flex';
                expName.textContent = status.currentExperiment;
            } else {
                banner.style.display = 'none';
            }

            // Update changes list
            const changesSection = document.getElementById('changesSection');
            const changesList = document.getElementById('changesList');

            if (changes.hasChanges) {
                changesSection.style.display = 'block';
                let html = '';

                changes.untracked.forEach(f => {
                    html += '<div class="change-item"><span class="indicator new"></span>' + f + '</div>';
                });
                changes.unstaged.forEach(f => {
                    html += '<div class="change-item"><span class="indicator modified"></span>' + f + '</div>';
                });

                changesList.innerHTML = html || '<div class="empty-state">No changes</div>';
            } else {
                changesSection.style.display = 'none';
            }

            // Update timeline
            const timelineList = document.getElementById('timelineList');

            if (timeline.length > 0) {
                let html = '';
                timeline.forEach((entry, index) => {
                    // Truncate long messages
                    const msg = entry.message.length > 60
                        ? entry.message.substring(0, 57) + '...'
                        : entry.message;
                    html += '<div class="timeline-item">' +
                        '<div class="timeline-message">' + escapeHtml(msg) + '</div>' +
                        '<div class="timeline-meta">' +
                        '<span class="date">' + entry.relativeDate + '</span>' +
                        '</div>' +
                        '</div>';
                });
                timelineList.innerHTML = html;
            } else {
                timelineList.innerHTML = '<div class="empty-state">No captures yet. Create your first!</div>';
            }

            // Update setup section visibility
            const setupSection = document.getElementById('setupSection');
            const startBtn = document.getElementById('startBtn');
            const connectBtn = document.getElementById('connectBtn');

            if (status.isRepo && isConnected) {
                // Fully set up, hide setup section
                setupSection.style.display = 'none';
            } else {
                setupSection.style.display = 'block';
                // Show relevant button based on state
                if (!status.isRepo) {
                    startBtn.style.display = 'flex';
                    connectBtn.style.display = 'none';
                } else if (!isConnected) {
                    startBtn.style.display = 'none';
                    connectBtn.style.display = 'flex';
                }
            }
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // Request initial data
        sendMessage('refresh');
    </script>
</body>
</html>`;
    }
}
