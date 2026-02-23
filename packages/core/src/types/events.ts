import type { Entity, EntityState, Mood } from './entity.js';
import type { Task, TaskStatus } from './task.js';

export interface EntityCreatedEvent {
  type: 'entity:created';
  timestamp: string;
  payload: { entity: Entity };
}

export interface EntityStateChangedEvent {
  type: 'entity:state-changed';
  timestamp: string;
  payload: {
    entityId: string;
    previousState: EntityState;
    newState: EntityState;
  };
}

export interface EntityEnergyUpdatedEvent {
  type: 'entity:energy-updated';
  timestamp: string;
  payload: {
    entityId: string;
    previousEnergy: number;
    newEnergy: number;
    mood: Mood;
  };
}

export interface TaskCreatedEvent {
  type: 'task:created';
  timestamp: string;
  payload: { task: Task };
}

export interface TaskAssignedEvent {
  type: 'task:assigned';
  timestamp: string;
  payload: {
    taskId: string;
    entityId: string;
  };
}

export interface TaskStartedEvent {
  type: 'task:started';
  timestamp: string;
  payload: {
    taskId: string;
    entityId: string;
  };
}

export interface TaskCompletedEvent {
  type: 'task:completed';
  timestamp: string;
  payload: {
    taskId: string;
    entityId: string;
    tokensUsed: number;
    cost: number;
  };
}

export interface TaskFailedEvent {
  type: 'task:failed';
  timestamp: string;
  payload: {
    taskId: string;
    entityId: string;
    error: string;
  };
}

export interface TaskDelegatedEvent {
  type: 'task:delegated';
  timestamp: string;
  payload: {
    taskId: string;
    fromEntityId: string;
    toEntityId: string;
    subTaskIds: string[];
  };
}

export interface AchievementUnlockedEvent {
  type: 'achievement:unlocked';
  timestamp: string;
  payload: {
    entityId: string;
    achievementId: string;
    achievementName: string;
    xpReward: number;
  };
}

export interface XPAwardedEvent {
  type: 'xp:awarded';
  timestamp: string;
  payload: {
    entityId: string;
    amount: number;
    source: string;
    newTotal: number;
    newLevel: number;
  };
}

export interface MessageSentEvent {
  type: 'message:sent';
  timestamp: string;
  payload: {
    fromEntityId: string;
    toEntityId: string | null;
    content: string;
    channel: string;
  };
}

export interface BoardSyncedEvent {
  type: 'board:synced';
  timestamp: string;
  payload: {
    boardProviderId: string;
    cardsCreated: number;
    cardsUpdated: number;
  };
}

export interface MemoryStoredEvent {
  type: 'memory:stored';
  timestamp: string;
  payload: {
    entityId: string;
    memoryType: 'episodic' | 'semantic' | 'skill';
    taskId: string | null;
    summary: string;
  };
}

export type DexterEvent =
  | EntityCreatedEvent
  | EntityStateChangedEvent
  | EntityEnergyUpdatedEvent
  | TaskCreatedEvent
  | TaskAssignedEvent
  | TaskStartedEvent
  | TaskCompletedEvent
  | TaskFailedEvent
  | TaskDelegatedEvent
  | AchievementUnlockedEvent
  | XPAwardedEvent
  | MessageSentEvent
  | BoardSyncedEvent
  | MemoryStoredEvent;

export type DexterEventType = DexterEvent['type'];
