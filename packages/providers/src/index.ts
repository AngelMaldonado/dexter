// LLM
export { createLLMProvider } from './llm/langchain-setup.js';

// Board
export { createBoardProvider, TrelloBoardProvider } from './board/index.js';
export type { BoardProviderConfig, BoardProviderType } from './board/index.js';

// MCP
export { MCPClientManager } from './mcp/client-manager.js';
export type { LangChainToolDefinition } from './mcp/client-manager.js';
