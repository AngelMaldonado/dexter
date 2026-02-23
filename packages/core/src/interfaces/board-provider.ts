export interface BoardCard {
  id: string;
  title: string;
  description: string;
  listName: string;
  labels: string[];
  assignees: string[];
  checklists: Array<{
    name: string;
    items: Array<{ text: string; checked: boolean }>;
  }>;
  comments: Array<{
    author: string;
    text: string;
    createdAt: string;
  }>;
  url: string;
}

export interface BoardList {
  id: string;
  name: string;
}

export interface BoardProvider {
  getCards(boardId: string, listId?: string): Promise<BoardCard[]>;
  moveCard(cardId: string, listId: string): Promise<void>;
  addComment(cardId: string, text: string): Promise<void>;
  updateCard(cardId: string, updates: Partial<BoardCard>): Promise<void>;
  addLabel(cardId: string, label: string): Promise<void>;
  removeLabel(cardId: string, label: string): Promise<void>;
  getLists(boardId: string): Promise<BoardList[]>;
}
