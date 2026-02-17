import type { BoardCard } from '../types/board.js';
import type { TaskStatus } from '../types/task.js';

export interface BoardProvider {
  readonly name: string;
  getCards(): Promise<BoardCard[]>;
  moveCard(cardId: string, status: TaskStatus): Promise<void>;
  addComment(cardId: string, comment: string): Promise<void>;
}
