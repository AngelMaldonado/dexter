import type { BoardProvider, BoardCard, BoardList } from '@dexter/core';

export class TrelloBoardProvider implements BoardProvider {
  constructor(
    private apiKey: string,
    private apiToken: string,
  ) {}

  async getCards(_boardId: string, _listId?: string): Promise<BoardCard[]> {
    // TODO: Implement Trello API integration in Phase 2
    return [];
  }

  async moveCard(_cardId: string, _listId: string): Promise<void> {
    throw new Error('Trello integration not yet implemented');
  }

  async addComment(_cardId: string, _text: string): Promise<void> {
    throw new Error('Trello integration not yet implemented');
  }

  async updateCard(_cardId: string, _updates: Partial<BoardCard>): Promise<void> {
    throw new Error('Trello integration not yet implemented');
  }

  async addLabel(_cardId: string, _label: string): Promise<void> {
    throw new Error('Trello integration not yet implemented');
  }

  async removeLabel(_cardId: string, _label: string): Promise<void> {
    throw new Error('Trello integration not yet implemented');
  }

  async getLists(_boardId: string): Promise<BoardList[]> {
    // TODO: Implement Trello API integration in Phase 2
    return [];
  }
}
