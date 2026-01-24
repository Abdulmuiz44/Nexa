import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import {
    CallToolResultSchema,
    ListToolsResultSchema,
    Tool
} from '@modelcontextprotocol/sdk/types.js';
import { createLogger } from './logger';

const logger = createLogger();

export interface MCPToolCall {
    name: string;
    arguments: Record<string, any>;
}

export const DEFAULT_MCP_SERVERS = {
    SEARCH: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-brave-search'],
        env: { BRAVE_API_KEY: process.env.BRAVE_API_KEY }
    },
    SCRAPER: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-fetch'],
    }
};

export class MCPClient {
    private client: Client;
    private transport: StdioClientTransport;
    private isConnected: boolean = false;

    constructor(serverCommand: string, args: string[] = [], env: Record<string, string> = {}) {
        this.transport = new StdioClientTransport({
            command: serverCommand,
            args: args,
            env: { ...process.env, ...env } as any
        });

        this.client = new Client(
            {
                name: 'nexa-mcp-client',
                version: '1.0.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );
    }

    async connect(): Promise<void> {
        if (this.isConnected) return;

        try {
            await this.client.connect(this.transport);
            this.isConnected = true;
            logger.info('MCP client connected successfully');
        } catch (error) {
            logger.error('Failed to connect to MCP server', { error });
            throw error;
        }
    }

    async listTools(): Promise<Tool[]> {
        if (!this.isConnected) await this.connect();

        try {
            const result = await this.client.request(
                { method: 'tools/list' },
                ListToolsResultSchema
            );
            return result.tools;
        } catch (error) {
            logger.error('Failed to list tools', { error });
            return [];
        }
    }

    async callTool(name: string, args: Record<string, any>): Promise<any> {
        if (!this.isConnected) await this.connect();

        try {
            logger.info(`Calling MCP tool: ${name}`, { args });
            const result = await this.client.request(
                {
                    method: 'tools/call',
                    params: {
                        name,
                        arguments: args,
                    },
                },
                CallToolResultSchema
            );

            if (result.isError) {
                throw new Error(`MCP tool error: ${JSON.stringify(result.content)}`);
            }

            return result.content;
        } catch (error) {
            logger.error(`Error calling MCP tool ${name}`, { error });
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        if (!this.isConnected) return;
        await this.transport.close();
        this.isConnected = false;
    }
}

/**
 * Convenience helper to execute a tool on a specific server
 */
export async function executeMCPTool(
    server: keyof typeof DEFAULT_MCP_SERVERS | { command: string; args?: string[]; env?: Record<string, string> },
    toolName: string,
    args: Record<string, any>,
    timeoutMs: number = 15000 // 15s default
): Promise<any> {
    const config = typeof server === 'string' ? DEFAULT_MCP_SERVERS[server] : server;

    // Check for API key if Brave Search
    if (typeof server === 'string' && server === 'SEARCH' && !process.env.BRAVE_API_KEY) {
        throw new Error('BRAVE_API_KEY is missing. Add it to your .env to enable real-time research.');
    }

    const client = new MCPClient(config.command, config.args || [], (config as any).env || {});

    const executionPromise = (async () => {
        try {
            await client.connect();
            return await client.callTool(toolName, args);
        } finally {
            await client.disconnect().catch(() => { });
        }
    })();

    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`MCP Tool ${toolName} timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    return Promise.race([executionPromise, timeoutPromise]);
}
