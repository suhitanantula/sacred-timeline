#!/usr/bin/env node
/**
 * Sacred Timeline MCP server
 *
 * Exposes the human vocabulary as structured tools so coding agents can use
 * Sacred Timeline without scraping CLI output.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { SacredTimeline } from './git-wrapper';

type JsonRpcId = string | number | null;

interface JsonRpcRequest {
    jsonrpc: '2.0';
    id?: JsonRpcId;
    method: string;
    params?: {
        name?: string;
        arguments?: Record<string, unknown>;
    } & Record<string, unknown>;
}

interface ToolDefinition {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
}

const SERVER_VERSION = '1.1.7';

const cwdSchema = {
    type: 'object',
    properties: {
        cwd: {
            type: 'string',
            description: 'Workspace folder to operate in. Defaults to the MCP server working directory.'
        }
    },
    additionalProperties: false
};

const tools: ToolDefinition[] = [
    {
        name: 'sacred_status',
        description: 'Show the current Sacred Timeline state for a workspace.',
        inputSchema: cwdSchema
    },
    {
        name: 'sacred_changes',
        description: 'Show files changed since the last capture.',
        inputSchema: cwdSchema
    },
    {
        name: 'sacred_timeline',
        description: 'List recent captures from the timeline.',
        inputSchema: {
            type: 'object',
            properties: {
                cwd: cwdSchema.properties.cwd,
                limit: {
                    type: 'number',
                    description: 'Maximum number of captures to return. Defaults to 30.'
                }
            },
            additionalProperties: false
        }
    },
    {
        name: 'sacred_narrate',
        description: 'Summarize recent progress in plain English.',
        inputSchema: {
            type: 'object',
            properties: {
                cwd: cwdSchema.properties.cwd,
                days: {
                    type: 'number',
                    description: 'Number of days to summarize. Defaults to 7.'
                }
            },
            additionalProperties: false
        }
    },
    {
        name: 'sacred_capture',
        description: 'Capture the current workspace changes with a human message.',
        inputSchema: {
            type: 'object',
            properties: {
                cwd: cwdSchema.properties.cwd,
                message: {
                    type: 'string',
                    description: 'Plain-English description of the moment being captured.'
                }
            },
            required: ['message'],
            additionalProperties: false
        }
    },
    {
        name: 'sacred_backup',
        description: 'Send local captures to the connected cloud remote.',
        inputSchema: cwdSchema
    },
    {
        name: 'sacred_latest',
        description: 'Bring the latest captures from the connected cloud remote.',
        inputSchema: cwdSchema
    },
    {
        name: 'sacred_experiment',
        description: 'Start a safe experiment branch.',
        inputSchema: {
            type: 'object',
            properties: {
                cwd: cwdSchema.properties.cwd,
                name: {
                    type: 'string',
                    description: 'Human name for the experiment.'
                }
            },
            required: ['name'],
            additionalProperties: false
        }
    },
    {
        name: 'sacred_keep',
        description: 'Keep the current experiment by merging it into the main timeline. Requires confirm=true.',
        inputSchema: confirmSchema()
    },
    {
        name: 'sacred_discard',
        description: 'Discard the current experiment branch. Requires confirm=true.',
        inputSchema: confirmSchema()
    },
    {
        name: 'sacred_restore',
        description: 'Restore an earlier capture. Requires confirm=true.',
        inputSchema: {
            type: 'object',
            properties: {
                cwd: cwdSchema.properties.cwd,
                hash: {
                    type: 'string',
                    description: 'Capture hash or ref to restore.'
                },
                confirm: {
                    type: 'boolean',
                    description: 'Must be true to restore.'
                }
            },
            required: ['hash', 'confirm'],
            additionalProperties: false
        }
    },
    {
        name: 'sacred_doctor',
        description: 'Check Sacred Timeline setup for a workspace and agent environment.',
        inputSchema: cwdSchema
    }
];

function confirmSchema(): Record<string, unknown> {
    return {
        type: 'object',
        properties: {
            cwd: cwdSchema.properties.cwd,
            confirm: {
                type: 'boolean',
                description: 'Must be true because this changes the timeline structure.'
            }
        },
        required: ['confirm'],
        additionalProperties: false
    };
}

function getString(args: Record<string, unknown>, key: string): string | null {
    const value = args[key];
    return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function getNumber(args: Record<string, unknown>, key: string, fallback: number): number {
    const value = args[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function getWorkspace(args: Record<string, unknown>): string {
    return getString(args, 'cwd') || process.cwd();
}

async function requireTimeline(sacred: SacredTimeline): Promise<{ ok: true } | { ok: false; message: string }> {
    if (await sacred.isRepository()) {
        return { ok: true };
    }

    return {
        ok: false,
        message: 'Not a Sacred Timeline yet. Run `sacred start` to begin.'
    };
}

async function buildStatusPayload(sacred: SacredTimeline): Promise<unknown> {
    const [status, changes, remotes, branch] = await Promise.all([
        sacred.getStatusSummary(),
        sacred.changes(),
        sacred.getRemotes(),
        sacred.getCurrentBranch()
    ]);

    return {
        status,
        changes,
        branch,
        remotes,
        connected: remotes.length > 0
    };
}

function getCommandOutput(command: string): string | null {
    try {
        return execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch {
        return null;
    }
}

async function buildDoctorPayload(sacred: SacredTimeline): Promise<unknown> {
    const checks: { name: string; ok: boolean; detail: string }[] = [];
    const recommendations: string[] = [];

    const nodeVersion = process.version;
    checks.push({ name: 'node', ok: true, detail: nodeVersion });

    const gitVersion = getCommandOutput('git --version');
    checks.push({ name: 'git', ok: Boolean(gitVersion), detail: gitVersion || 'git not found' });
    if (!gitVersion) {
        recommendations.push('Install git before using Sacred Timeline.');
    }

    const cliPath = getCommandOutput('command -v sacred');
    checks.push({ name: 'sacred-cli', ok: Boolean(cliPath), detail: cliPath || 'sacred CLI not found' });
    if (!cliPath) {
        recommendations.push('Install Sacred Timeline with `npm install -g @suhit/sacred-timeline`.');
    }

    const isRepo = await sacred.isRepository();
    checks.push({
        name: 'timeline',
        ok: isRepo,
        detail: isRepo ? 'Git timeline detected' : 'No git timeline in this folder'
    });
    if (!isRepo) {
        recommendations.push('Run `sacred start` in the folder you want to protect.');
    } else {
        const status = await sacred.getStatusSummary();
        const remotes = await sacred.getRemotes();

        checks.push({
            name: 'cloud-connection',
            ok: remotes.length > 0,
            detail: remotes.length > 0 ? remotes.map(remote => remote.name).join(', ') : 'No remote connected'
        });
        if (remotes.length === 0) {
            recommendations.push('Run `sacred connect <github-url>` to connect cloud backup.');
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
    }

    const codexSkill = path.join(os.homedir(), '.codex/skills/sacred-timeline/SKILL.md');
    checks.push({
        name: 'codex-skill',
        ok: fs.existsSync(codexSkill),
        detail: fs.existsSync(codexSkill) ? codexSkill : 'Codex skill not installed'
    });
    if (!fs.existsSync(codexSkill)) {
        recommendations.push('Install the Codex skill from this package or rerun the installer.');
    }

    const claudeSkill = path.join(os.homedir(), '.claude/skills/sacred-timeline/SKILL.md');
    checks.push({
        name: 'claude-skill',
        ok: fs.existsSync(claudeSkill),
        detail: fs.existsSync(claudeSkill) ? claudeSkill : 'Claude Code skill not installed'
    });

    return {
        ok: checks.every(check => check.ok),
        checks,
        recommendations
    };
}

function textResult(payload: unknown, isError = false): unknown {
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(payload, null, 2)
            }
        ],
        isError
    };
}

async function callTool(name: string, rawArgs: Record<string, unknown> = {}): Promise<unknown> {
    const workspace = getWorkspace(rawArgs);
    const sacred = new SacredTimeline(workspace);

    if (name !== 'sacred_doctor') {
        const repo = await requireTimeline(sacred);
        if (!repo.ok) {
            return textResult({ success: false, error: 'not_a_timeline', message: repo.message }, true);
        }
    }

    switch (name) {
        case 'sacred_status':
            return textResult(await buildStatusPayload(sacred));
        case 'sacred_changes':
            return textResult(await sacred.changes());
        case 'sacred_timeline':
            return textResult(await sacred.timeline(getNumber(rawArgs, 'limit', 30)));
        case 'sacred_narrate':
            return textResult(await sacred.narrate(getNumber(rawArgs, 'days', 7)));
        case 'sacred_capture': {
            const message = getString(rawArgs, 'message');
            if (!message) {
                return textResult({ success: false, message: 'message is required' }, true);
            }
            return textResult(await sacred.capture(message));
        }
        case 'sacred_backup':
            return textResult(await sacred.backup());
        case 'sacred_latest':
            return textResult(await sacred.update());
        case 'sacred_experiment': {
            const experimentName = getString(rawArgs, 'name');
            if (!experimentName) {
                return textResult({ success: false, message: 'name is required' }, true);
            }
            return textResult(await sacred.experiment(experimentName));
        }
        case 'sacred_keep':
            if (rawArgs.confirm !== true) {
                return textResult({ success: false, message: 'Set confirm=true to keep this experiment.' }, true);
            }
            return textResult(await sacred.keep());
        case 'sacred_discard':
            if (rawArgs.confirm !== true) {
                return textResult({ success: false, message: 'Set confirm=true to discard this experiment.' }, true);
            }
            return textResult(await sacred.discard());
        case 'sacred_restore': {
            const hash = getString(rawArgs, 'hash');
            if (!hash) {
                return textResult({ success: false, message: 'hash is required' }, true);
            }
            if (rawArgs.confirm !== true) {
                return textResult({ success: false, message: 'Set confirm=true to restore an earlier capture.' }, true);
            }
            return textResult(await sacred.restore(hash));
        }
        case 'sacred_doctor':
            return textResult(await buildDoctorPayload(sacred));
        default:
            return textResult({ success: false, message: `Unknown tool: ${name}` }, true);
    }
}

async function handleRequest(request: JsonRpcRequest): Promise<unknown | undefined> {
    if (request.id === undefined) {
        return undefined;
    }

    switch (request.method) {
        case 'initialize':
            return {
                jsonrpc: '2.0',
                id: request.id,
                result: {
                    protocolVersion: '2024-11-05',
                    capabilities: {
                        tools: {}
                    },
                    serverInfo: {
                        name: 'sacred-timeline',
                        version: SERVER_VERSION
                    }
                }
            };
        case 'tools/list':
            return {
                jsonrpc: '2.0',
                id: request.id,
                result: {
                    tools
                }
            };
        case 'tools/call': {
            const name = request.params?.name;
            if (!name) {
                return errorResponse(request.id, -32602, 'Tool name is required');
            }
            try {
                const result = await callTool(name, request.params?.arguments || {});
                return {
                    jsonrpc: '2.0',
                    id: request.id,
                    result
                };
            } catch (error) {
                return errorResponse(request.id, -32000, error instanceof Error ? error.message : 'Unknown error');
            }
        }
        default:
            return errorResponse(request.id, -32601, `Method not found: ${request.method}`);
    }
}

function errorResponse(id: JsonRpcId, code: number, message: string): unknown {
    return {
        jsonrpc: '2.0',
        id,
        error: {
            code,
            message
        }
    };
}

function sendMessage(message: unknown): void {
    const payload = JSON.stringify(message);
    process.stdout.write(`Content-Length: ${Buffer.byteLength(payload, 'utf8')}\r\n\r\n${payload}`);
}

let inputBuffer = Buffer.alloc(0);
let processing = false;

process.stdin.on('data', chunk => {
    inputBuffer = Buffer.concat([inputBuffer, chunk]);

    void (async () => {
        if (processing) {
            return;
        }
        processing = true;

        while (true) {
            const headerEnd = inputBuffer.indexOf('\r\n\r\n');
            if (headerEnd === -1) {
                processing = false;
                return;
            }

            const header = inputBuffer.subarray(0, headerEnd).toString('utf8');
            const match = header.match(/Content-Length:\s*(\d+)/i);
            if (!match) {
                inputBuffer = Buffer.alloc(0);
                processing = false;
                return;
            }

            const bodyLength = Number(match[1]);
            const bodyStart = headerEnd + 4;
            const messageEnd = bodyStart + bodyLength;
            if (inputBuffer.length < messageEnd) {
                processing = false;
                return;
            }

            const body = inputBuffer.subarray(bodyStart, messageEnd).toString('utf8');
            inputBuffer = inputBuffer.subarray(messageEnd);

            try {
                const request = JSON.parse(body) as JsonRpcRequest;
                const response = await handleRequest(request);
                if (response) {
                    sendMessage(response);
                }
            } catch (error) {
                sendMessage(errorResponse(null, -32700, error instanceof Error ? error.message : 'Parse error'));
            }
        }
    })();
});
