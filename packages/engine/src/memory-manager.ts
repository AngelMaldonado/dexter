import type { DexterEvent } from '@dexter/core';
import { generateId } from '@dexter/core';
import { EventBus } from './event-bus.js';

export type MemoryType = 'episodic' | 'semantic' | 'skill';

export interface Memory {
  id: string;
  entityId: string;
  type: MemoryType;
  content: string;
  taskId: string | null;
  keywords: string[];
  createdAt: string;
}

export class MemoryManager {
  private memories = new Map<string, Memory[]>();

  constructor(private eventBus: EventBus) {}

  storeMemory(
    entityId: string,
    type: MemoryType,
    content: string,
    taskId: string | null = null,
  ): Memory {
    const memory: Memory = {
      id: generateId(),
      entityId,
      type,
      content,
      taskId,
      keywords: extractKeywords(content),
      createdAt: new Date().toISOString(),
    };

    const existing = this.memories.get(entityId) ?? [];
    existing.push(memory);
    this.memories.set(entityId, existing);

    this.eventBus.emit({
      type: 'memory:stored',
      timestamp: new Date().toISOString(),
      payload: {
        entityId,
        memoryType: type,
        taskId,
        summary: content.slice(0, 100),
      },
    });

    return memory;
  }

  getRelevantMemories(entityId: string, taskContext: string, limit = 10): Memory[] {
    const entityMemories = this.memories.get(entityId) ?? [];
    if (entityMemories.length === 0) return [];

    const contextKeywords = extractKeywords(taskContext);

    const scored = entityMemories.map(memory => ({
      memory,
      score: calculateRelevance(memory.keywords, contextKeywords),
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map(s => s.memory);
  }

  getMemoriesByEntity(entityId: string): Memory[] {
    return this.memories.get(entityId) ?? [];
  }

  getMemoriesByType(entityId: string, type: MemoryType): Memory[] {
    const entityMemories = this.memories.get(entityId) ?? [];
    return entityMemories.filter(m => m.type === type);
  }
}

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3);
}

function calculateRelevance(memoryKeywords: string[], contextKeywords: string[]): number {
  if (memoryKeywords.length === 0 || contextKeywords.length === 0) return 0;

  let matches = 0;
  for (const keyword of contextKeywords) {
    if (memoryKeywords.includes(keyword)) matches++;
  }

  return matches / contextKeywords.length;
}
