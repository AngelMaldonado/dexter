import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { CreateEntityInput, Entity, UpdateEntityInput } from '@dexter/core';
import type { DexterDb } from '../connection.js';
import { entities } from '../schema.js';

export class EntityRepository {
  constructor(private db: DexterDb) {}

  findAll(): Entity[] {
    const rows = this.db.select().from(entities).all();
    return rows.map(toEntity);
  }

  findById(id: string): Entity | undefined {
    const row = this.db.select().from(entities).where(eq(entities.id, id)).get();
    return row ? toEntity(row) : undefined;
  }

  findByDepartment(departmentId: string): Entity[] {
    const rows = this.db.select().from(entities).where(eq(entities.departmentId, departmentId)).all();
    return rows.map(toEntity);
  }

  create(input: CreateEntityInput): Entity {
    const now = new Date().toISOString();
    const id = ulid();
    const row = {
      id,
      name: input.name,
      role: input.role,
      departmentId: input.departmentId ?? null,
      skills: JSON.stringify(input.skills),
      personality: JSON.stringify(input.personality),
      communication: input.communication,
      rules: JSON.stringify(input.rules),
      backstory: input.backstory,
      state: 'idle' as const,
      mood: 'neutral' as const,
      energy: 100,
      avatarUrl: input.avatarUrl ?? null,
      llmConfigId: input.llmConfigId ?? null,
      soulPath: input.soulPath,
      createdAt: now,
      updatedAt: now,
    };
    this.db.insert(entities).values(row).run();
    return toEntity(row);
  }

  update(id: string, input: UpdateEntityInput): Entity | undefined {
    const existing = this.findById(id);
    if (!existing) return undefined;

    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (input.name !== undefined) updates.name = input.name;
    if (input.role !== undefined) updates.role = input.role;
    if (input.departmentId !== undefined) updates.departmentId = input.departmentId;
    if (input.skills !== undefined) updates.skills = JSON.stringify(input.skills);
    if (input.personality !== undefined) updates.personality = JSON.stringify(input.personality);
    if (input.communication !== undefined) updates.communication = input.communication;
    if (input.rules !== undefined) updates.rules = JSON.stringify(input.rules);
    if (input.backstory !== undefined) updates.backstory = input.backstory;
    if (input.state !== undefined) updates.state = input.state;
    if (input.mood !== undefined) updates.mood = input.mood;
    if (input.energy !== undefined) updates.energy = input.energy;
    if (input.avatarUrl !== undefined) updates.avatarUrl = input.avatarUrl;
    if (input.llmConfigId !== undefined) updates.llmConfigId = input.llmConfigId;

    this.db.update(entities).set(updates).where(eq(entities.id, id)).run();
    return this.findById(id);
  }

  delete(id: string): boolean {
    const existing = this.findById(id);
    if (!existing) return false;
    this.db.delete(entities).where(eq(entities.id, id)).run();
    return true;
  }
}

function toEntity(row: typeof entities.$inferSelect): Entity {
  return {
    ...row,
    skills: JSON.parse(row.skills),
    personality: JSON.parse(row.personality),
    rules: JSON.parse(row.rules),
    state: row.state as Entity['state'],
    mood: row.mood as Entity['mood'],
  };
}
