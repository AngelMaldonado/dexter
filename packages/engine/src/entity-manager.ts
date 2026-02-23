import type {
  Entity,
  CreateEntityInput,
  UpdateEntityInput,
  EntityState,
  ParsedSoul,
} from '@dexter/core';
import { parseSoul, generateId } from '@dexter/core';
import { EventBus } from './event-bus.js';

const VALID_TRANSITIONS: Record<EntityState, EntityState[]> = {
  idle: ['working', 'thinking', 'collaborating', 'on_break'],
  working: ['idle', 'thinking', 'blocked', 'on_break'],
  thinking: ['idle', 'working', 'blocked'],
  blocked: ['idle', 'working'],
  on_break: ['idle'],
  collaborating: ['idle', 'working', 'thinking'],
};

export class EntityManager {
  private entities = new Map<string, Entity>();

  constructor(private eventBus: EventBus) {}

  createEntity(input: CreateEntityInput): Entity {
    const parsedSoul = parseSoul(input.soulMd);

    // Auto-assign desk position if not provided
    let deskX = input.deskX ?? null;
    let deskY = input.deskY ?? null;
    if (deskX === null || deskY === null) {
      const pos = this.nextDeskPosition();
      deskX = pos.x;
      deskY = pos.y;
    }

    const entity: Entity = {
      id: generateId(),
      name: input.name,
      soulMd: input.soulMd,
      parsedSoul,
      departmentId: input.departmentId ?? null,
      hierarchyRole: input.hierarchyRole ?? parsedSoul.hierarchy,
      behaviorMode: input.behaviorMode ?? 'autonomous',
      state: 'idle',
      energy: 100,
      mood: 'neutral',
      xp: 0,
      level: 1,
      deskX,
      deskY,
      llmConfigId: input.llmConfigId ?? null,
      maxConcurrentTasks: 1,
      energyDrainRate: 10,
      energyRecoveryRate: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.entities.set(entity.id, entity);

    this.eventBus.emit({
      type: 'entity:created',
      timestamp: new Date().toISOString(),
      payload: { entity },
    });

    return entity;
  }

  updateEntity(id: string, updates: UpdateEntityInput): Entity | undefined {
    const entity = this.entities.get(id);
    if (!entity) return undefined;

    let newParsedSoul: ParsedSoul | undefined;
    if (updates.soulMd) {
      newParsedSoul = parseSoul(updates.soulMd);
    }

    const updated: Entity = {
      ...entity,
      ...updates,
      parsedSoul: newParsedSoul ?? entity.parsedSoul,
      updatedAt: new Date().toISOString(),
    };

    this.entities.set(id, updated);
    return updated;
  }

  transitionState(id: string, newState: EntityState): Entity | undefined {
    const entity = this.entities.get(id);
    if (!entity) return undefined;

    const allowed = VALID_TRANSITIONS[entity.state];
    if (!allowed.includes(newState)) {
      throw new Error(
        `Invalid state transition: ${entity.state} → ${newState}`,
      );
    }

    const previousState = entity.state;
    const updated: Entity = {
      ...entity,
      state: newState,
      updatedAt: new Date().toISOString(),
    };

    this.entities.set(id, updated);

    this.eventBus.emit({
      type: 'entity:state-changed',
      timestamp: new Date().toISOString(),
      payload: {
        entityId: id,
        previousState,
        newState,
      },
    });

    return updated;
  }

  deleteEntity(id: string): boolean {
    return this.entities.delete(id);
  }

  getEntity(id: string): Entity | undefined {
    return this.entities.get(id);
  }

  getAllEntities(): Entity[] {
    return Array.from(this.entities.values());
  }

  getEntitiesByDepartment(departmentId: string): Entity[] {
    return this.getAllEntities().filter(e => e.departmentId === departmentId);
  }

  /** Find the next available desk position on a grid starting at (3,3) with spacing of 2 */
  private nextDeskPosition(): { x: number; y: number } {
    const occupied = new Set<string>();
    for (const e of this.entities.values()) {
      if (e.deskX !== null && e.deskY !== null) {
        occupied.add(`${e.deskX}:${e.deskY}`);
      }
    }
    // Place desks in rows starting at (3,3), spacing 2 apart, max 8 per row
    const startX = 3;
    const startY = 3;
    const spacing = 2;
    const perRow = 8;
    for (let i = 0; i < 200; i++) {
      const x = startX + (i % perRow) * spacing;
      const y = startY + Math.floor(i / perRow) * spacing;
      if (!occupied.has(`${x}:${y}`)) return { x, y };
    }
    return { x: startX, y: startY };
  }

  /** Load entities from an external source (e.g. database) */
  loadEntities(entities: Entity[]): void {
    for (const entity of entities) {
      this.entities.set(entity.id, entity);
    }
  }
}
