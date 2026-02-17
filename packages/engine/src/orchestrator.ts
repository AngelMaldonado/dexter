import type { Entity, Task, LLMProvider, DexterEvent } from '@dexter/core';
import type { DexterDb } from '@dexter/db';
import { TaskRepository } from '@dexter/db';
import { ActivityRepository } from '@dexter/db';
import { EventBus } from './event-bus.js';
import { EntityManager } from './entity-manager.js';
import { EntityRuntime } from './entity-runtime.js';
import { Scheduler } from './scheduler.js';

export class Orchestrator {
  readonly eventBus: EventBus;
  readonly entityManager: EntityManager;
  readonly scheduler: Scheduler;
  private runtime: EntityRuntime;
  private taskRepo: TaskRepository;
  private activityRepo: ActivityRepository;
  private llmProviders = new Map<string, LLMProvider>();
  private defaultLLMProvider: LLMProvider | null = null;

  constructor(private db: DexterDb) {
    this.eventBus = new EventBus();
    this.entityManager = new EntityManager(db, this.eventBus);
    this.scheduler = new Scheduler();
    this.runtime = new EntityRuntime(db, this.eventBus);
    this.taskRepo = new TaskRepository(db);
    this.activityRepo = new ActivityRepository(db);

    this.setupEventLogging();
  }

  registerLLMProvider(name: string, provider: LLMProvider, isDefault = false): void {
    this.llmProviders.set(name, provider);
    if (isDefault || !this.defaultLLMProvider) {
      this.defaultLLMProvider = provider;
    }
  }

  getTaskRepo(): TaskRepository {
    return this.taskRepo;
  }

  getActivityRepo(): ActivityRepository {
    return this.activityRepo;
  }

  async assignAndExecute(taskId: string, entityId?: string): Promise<string> {
    const task = this.taskRepo.findById(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    let entity: Entity | undefined;
    if (entityId) {
      entity = this.entityManager.getById(entityId);
      if (!entity) throw new Error(`Entity ${entityId} not found`);
    } else {
      const all = this.entityManager.getAll();
      const best = this.scheduler.findBestEntity(task, all);
      if (!best) throw new Error('No available entity for this task');
      entity = best;
    }

    // Assign task
    this.taskRepo.update(task.id, { assigneeId: entity.id, status: 'in_progress' });
    this.eventBus.emit({
      type: 'task:assigned',
      taskId: task.id,
      entityId: entity.id,
      timestamp: new Date().toISOString(),
    });
    this.eventBus.emit({
      type: 'task:status-changed',
      taskId: task.id,
      previousStatus: task.status,
      newStatus: 'in_progress',
      timestamp: new Date().toISOString(),
    });

    // Update entity state
    this.entityManager.update(entity.id, { state: 'working' });

    // Get LLM provider
    const provider = this.defaultLLMProvider;
    if (!provider) throw new Error('No LLM provider registered');

    try {
      const startTime = Date.now();
      const result = await this.runtime.executeTask(entity, task, provider);
      const durationMinutes = Math.round((Date.now() - startTime) / 60000);

      // Update task as done
      this.taskRepo.update(task.id, {
        status: 'done',
        actualMinutes: durationMinutes,
        completedAt: new Date().toISOString(),
      });

      // Update entity state and energy
      const energyCost = Math.min(20, Math.max(5, durationMinutes * 2));
      this.entityManager.update(entity.id, {
        state: 'idle',
        energy: Math.max(0, entity.energy - energyCost),
      });

      this.eventBus.emit({
        type: 'task:completed',
        taskId: task.id,
        entityId: entity.id,
        durationMinutes,
        timestamp: new Date().toISOString(),
      });

      return result;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);

      this.taskRepo.update(task.id, { status: 'failed' });
      this.entityManager.update(entity.id, { state: 'idle', mood: 'frustrated' });

      this.eventBus.emit({
        type: 'task:failed',
        taskId: task.id,
        entityId: entity.id,
        error: errMsg,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  private setupEventLogging(): void {
    this.eventBus.onAny((event) => {
      const entityId = 'entityId' in event ? (event.entityId as string) : undefined;
      this.activityRepo.create({
        entityId,
        type: event.type,
        message: formatEventMessage(event),
        metadata: JSON.parse(JSON.stringify(event)),
      });
    });
  }
}

function formatEventMessage(event: DexterEvent): string {
  switch (event.type) {
    case 'entity:created':
      return `Entity created: ${event.entity.name}`;
    case 'entity:state-changed':
      return `Entity state: ${event.previousState} → ${event.newState}`;
    case 'task:assigned':
      return `Task ${event.taskId} assigned to entity ${event.entityId}`;
    case 'task:completed':
      return `Task ${event.taskId} completed in ${event.durationMinutes}min`;
    case 'task:failed':
      return `Task ${event.taskId} failed: ${event.error}`;
    default:
      return `Event: ${event.type}`;
  }
}
