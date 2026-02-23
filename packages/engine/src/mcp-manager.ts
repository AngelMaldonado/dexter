import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { MCPServerConfig, Entity } from '@dexter/core';

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  serverId: string;
}

interface ConnectedServer {
  config: MCPServerConfig;
  client: Client;
  tools: MCPTool[];
}

export class MCPManager {
  private servers = new Map<string, ConnectedServer>();

  async connectServer(config: MCPServerConfig): Promise<void> {
    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args,
      env: config.env,
    });

    const client = new Client({
      name: 'dexter-engine',
      version: '0.1.0',
    });

    await client.connect(transport);

    const toolsResult = await client.listTools();
    const tools: MCPTool[] = (toolsResult.tools ?? []).map(tool => ({
      name: tool.name,
      description: tool.description ?? '',
      inputSchema: (tool.inputSchema as Record<string, unknown>) ?? {},
      serverId: config.id,
    }));

    this.servers.set(config.id, { config, client, tools });
  }

  async disconnectServer(serverId: string): Promise<void> {
    const server = this.servers.get(serverId);
    if (!server) return;

    await server.client.close();
    this.servers.delete(serverId);
  }

  async disconnectAll(): Promise<void> {
    for (const [serverId] of this.servers) {
      await this.disconnectServer(serverId);
    }
  }

  getToolsForEntity(entity: Entity): MCPTool[] {
    const mcpServers = entity.parsedSoul.mcpServers;
    if (!mcpServers) return [];

    const tools: MCPTool[] = [];

    for (const [serverName, _serverConfig] of Object.entries(mcpServers)) {
      for (const [_serverId, connected] of this.servers) {
        if (connected.config.name === serverName) {
          tools.push(...connected.tools);
        }
      }
    }

    return tools;
  }

  getAllTools(): MCPTool[] {
    const tools: MCPTool[] = [];
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

    const result = await server.client.callTool({ name: toolName, arguments: args });
    return result;
  }

  getConnectedServers(): MCPServerConfig[] {
    return Array.from(this.servers.values()).map(s => s.config);
  }
}
