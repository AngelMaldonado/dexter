export interface MCPServerConfig {
  id: string;
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  capabilities: MCPCapability[];
  createdAt: string;
}

export interface MCPCapability {
  name: string;
  description: string;
  enabled: boolean;
}

export interface EntityToolAccess {
  entityId: string;
  mcpServerId: string;
  allowedCapabilities: string[];
}
