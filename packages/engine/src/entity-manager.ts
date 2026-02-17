import { readFileSync } from 'fs';
import type { Entity, CreateEntityInput, UpdateEntityInput } from '@dexter/core';
import { parseSoul } from '@dexter/core';
import { EntityRepository } from '@dexter/db';
import type { DexterDb } from '@dexter/db';
import { EventBus } from './event-bus.js';

export class EntityManager {
  private repo: EntityRepository;

  constructor(
    private db: DexterDb,
    private eventBus: EventBus,
  ) {
    this.repo = new EntityRepository(db);
  }

  getAll(): Entity[] {
    return this.repo.findAll();
  }

  getById(id: string): Entity | undefined {
    return this.repo.findById(id);
  }

  createFromSoul(soulPath: string, llmConfigId?: string, departmentId?: string): Entity {
    const content = readFileSync(soulPath, 'utf-8');
    const soul = parseSoul(content);

    const input: CreateEntityInput = {
      name: soul.name,
      role: soul.role,
      skills: soul.skills,
      personality: soul.personality,
      communication: soul.communication,
      rules: soul.rules,
      backstory: soul.backstory,
      soulPath,
      llmConfigId,
      departmentId,
    };

    const entity = this.repo.create(input);

    this.eventBus.emit({
      type: 'entity:created',
      entity,
      timestamp: new Date().toISOString(),
    });

    return entity;
  }

  create(input: CreateEntityInput): Entity {
    const entity = this.repo.create(input);

    this.eventBus.emit({
      type: 'entity:created',
      entity,
      timestamp: new Date().toISOString(),
    });

    return entity;
  }

  update(id: string, input: UpdateEntityInput): Entity | undefined {
    const previous = this.repo.findById(id);
    if (!previous) return undefined;

    const entity = this.repo.update(id, input);
    if (!entity) return undefined;

    if (input.state && input.state !== previous.state) {
      this.eventBus.emit({
        type: 'entity:state-changed',
        entityId: id,
        previousState: previous.state,
        newState: input.state,
        timestamp: new Date().toISOString(),
      });
    }

    if (input.mood && input.mood !== previous.mood) {
      this.eventBus.emit({
        type: 'entity:mood-changed',
        entityId: id,
        previousMood: previous.mood,
        newMood: input.mood,
        timestamp: new Date().toISOString(),
      });
    }

    if (input.energy !== undefined && input.energy !== previous.energy) {
      this.eventBus.emit({
        type: 'entity:energy-changed',
        entityId: id,
        previousEnergy: previous.energy,
        newEnergy: input.energy,
        timestamp: new Date().toISOString(),
      });
    }

    this.eventBus.emit({
      type: 'entity:updated',
      entity,
      timestamp: new Date().toISOString(),
    });

    return entity;
  }

  delete(id: string): boolean {
    const deleted = this.repo.delete(id);
    if (deleted) {
      this.eventBus.emit({
        type: 'entity:deleted',
        entityId: id,
        timestamp: new Date().toISOString(),
      });
    }
    return deleted;
  }
}
