import { create } from 'zustand';

export type BubbleType = 'thought' | 'speech' | 'status';

export interface Bubble {
  entityId: string;
  text: string;
  type: BubbleType;
  createdAt: number;
}

interface BubbleStore {
  bubbles: Map<string, Bubble>;
  addBubble: (entityId: string, text: string, type: BubbleType) => void;
  removeBubble: (entityId: string) => void;
  clearAll: () => void;
}

const BUBBLE_TTL = 5000;

export const useBubbleStore = create<BubbleStore>((set) => ({
  bubbles: new Map(),

  addBubble: (entityId, text, type) =>
    set((s) => {
      const next = new Map(s.bubbles);
      next.set(entityId, { entityId, text, type, createdAt: Date.now() });
      return { bubbles: next };
    }),

  removeBubble: (entityId) =>
    set((s) => {
      const next = new Map(s.bubbles);
      next.delete(entityId);
      return { bubbles: next };
    }),

  clearAll: () => set({ bubbles: new Map() }),
}));

// Auto-expire bubbles every second
setInterval(() => {
  const { bubbles } = useBubbleStore.getState();
  const now = Date.now();
  let changed = false;
  const next = new Map(bubbles);
  for (const [id, bubble] of next) {
    if (now - bubble.createdAt > BUBBLE_TTL) {
      next.delete(id);
      changed = true;
    }
  }
  if (changed) {
    useBubbleStore.setState({ bubbles: next });
  }
}, 1000);
