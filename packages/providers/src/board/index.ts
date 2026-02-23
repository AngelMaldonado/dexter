import type { BoardProvider } from '@dexter/core';
import { TrelloBoardProvider } from './trello.js';

export type BoardProviderType = 'trello';

export interface BoardProviderConfig {
  type: BoardProviderType;
  apiKey: string;
  apiToken: string;
}

export function createBoardProvider(config: BoardProviderConfig): BoardProvider {
  switch (config.type) {
    case 'trello':
      return new TrelloBoardProvider(config.apiKey, config.apiToken);
    default:
      throw new Error(`Unsupported board provider: ${config.type}`);
  }
}

export { TrelloBoardProvider } from './trello.js';
