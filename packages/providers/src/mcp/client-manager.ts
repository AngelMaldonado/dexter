import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { MCPServerConfig, Entity } from '@dexter/core';

export interface LangChainToolDefinition {
  name: string;
  description: string;
  schema: Record<string, unknown>;
}

interface ConnectedMCPServer {
  config: MCPServerConfig;
  client: Client;
  tools: LangChainToolDefinition[];
}

export class MCPClientManager {
  private servers = new Map<string, ConnectedMCPServer>();

  async connect(config: MCPServerConfig): Promise<void> {
    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args,
      env: config.env,
    });

    const client = new Client({
      name: 'dexter-providers',
      version: '0.1.0',
    });

    await client.connect(transport);

    const result = await client.listTools();
    const tools: LangChainToolDefinition[] = (result.tools ?? []).map(tool => ({
      name: tool.name,
      description: tool.description ?? '',
      schema: (tool.inputSchema as Record<string, unknown>) ?? {},
    }));

    this.servers.set(config.id, { config, client, tools });
  }

  async disconnect(serverId: string): Promise<void> {
    const server = this.servers.get(serverId);
    if (!server) return;

    await server.client.close();
    this.servers.delete(serverId);
  }

  async disconnectAll(): Promise<void> {
    for (const [serverId] of this.servers) {
      await this.disconnect(serverId);
    }
  }

  getToolsForEntity(entity: Entity): LangChainToolDefinition[] {
    const mcpServers = entity.parsedSoul.mcpServers;
    if (!mcpServers) return [];

    const tools: LangChainToolDefinition[] = [];

    for (const serverName of Object.keys(mcpServers)) {
      for (const connected of this.servers.values()) {
        if (connected.config.name === serverName) {
          tools.push(...connected.tools);
        }
      }
    }

    return tools;
  }

  getAllTools(): LangChainToolDefinition[] {
    const tools: LangChainToolDefinition[] = [];
    for (const server of this.servers.values()) {
      tools.push(...server.tools);
    }
    return tools;
  }

  async callTool(
    serverId: string,
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<unknown> {
    const server = this.servers.get(serverId);
    if (!server) throw new Error(`MCP server ${serverId} not connected`);

    return server.client.callTool({ name: toolName, arguments: args });
  }
}
