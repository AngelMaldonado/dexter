import type { Entity, EntityState, Mood } from './entity.js';
import type { Task, TaskStatus } from './task.js';

export interface EntityStateChangedEvent {
  type: 'entity:state-changed';
  entityId: string;
  previousState: EntityState;
  newState: EntityState;
  timestamp: string;
}

export interface EntityMoodChangedEvent {
  type: 'entity:mood-changed';
  entityId: string;
  previousMood: Mood;
  newMood: Mood;
  timestamp: string;
}

export interface EntityEnergyChangedEvent {
  type: 'entity:energy-changed';
  entityId: string;
  previousEnergy: number;
  newEnergy: number;
  timestamp: string;
}

export interface EntityCreatedEvent {
  type: 'entity:created';
  entity: Entity;
  timestamp: string;
}

export interface EntityUpdatedEvent {
  type: 'entity:updated';
  entity: Entity;
  timestamp: string;
}

export interface EntityDeletedEvent {
  type: 'entity:deleted';
  entityId: string;
  timestamp: string;
}

export interface TaskCreatedEvent {
  type: 'task:created';
  task: Task;
  timestamp: string;
}

export interface TaskAssignedEvent {
  type: 'task:assigned';
  taskId: string;
  entityId: string;
  timestamp: string;
}

export interface TaskStatusChangedEvent {
  type: 'task:status-changed';
  taskId: string;
  previousStatus: TaskStatus;
  newStatus: TaskStatus;
  timestamp: string;
}

export interface TaskCompletedEvent {
  type: 'task:completed';
  taskId: string;
  entityId: string;
  durationMinutes: number;
  timestamp: string;
}

export interface TaskFailedEvent {
  type: 'task:failed';
  taskId: string;
  entityId: string;
  error: string;
  timestamp: string;
}

export interface AchievementUnlockedEvent {
  type: 'achievement:unlocked';
  entityId: string;
  achievementId: string;
  achievementName: string;
  points: number;
  timestamp: string;
}

export interface ExecutionStartedEvent {
  type: 'execution:started';
  runId: string;
  taskId: string;
  entityId: string;
  timestamp: string;
}

export interface ExecutionCompletedEvent {
  type: 'execution:completed';
  runId: string;
  taskId: string;
  entityId: string;
  result: string;
  timestamp: string;
}

export type DexterEvent =
  | EntityStateChangedEvent
  | EntityMoodChangedEvent
  | EntityEnergyChangedEvent
  | EntityCreatedEvent
  | EntityUpdatedEvent
  | EntityDeletedEvent
  | TaskCreatedEvent
  | TaskAssignedEvent
  | TaskStatusChangedEvent
  | TaskCompletedEvent
  | TaskFailedEvent
  | AchievementUnlockedEvent
  | ExecutionStartedEvent
  | ExecutionCompletedEvent;

export type DexterEventType = DexterEvent['type'];
