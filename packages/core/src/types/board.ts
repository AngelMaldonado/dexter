export type BoardProviderType = 'trello' | 'github' | 'jira' | 'linear';

export interface BoardConfig {
  id: string;
  name: string;
  provider: BoardProviderType;
  credentials: string; // JSON-encoded credentials
  boardId: string;
  mappings: string; // JSON-encoded column-to-status mappings
  syncEnabled: boolean;
  pollIntervalMs: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBoardConfigInput {
  name: string;
  provider: BoardProviderType;
  credentials: string;
  boardId: string;
  mappings?: string;
  pollIntervalMs?: number;
}

export interface BoardCard {
  id: string;
  title: string;
  description: string;
  status: string;
  labels: string[];
  assignee: string | null;
  url: string | null;
}
