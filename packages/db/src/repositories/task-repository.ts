import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { CreateTaskInput, Task, UpdateTaskInput } from '@dexter/core';
import type { DexterDb } from '../connection.js';
import { tasks } from '../schema.js';

export class TaskRepository {
  constructor(private db: DexterDb) {}

  findAll(): Task[] {
    const rows = this.db.select().from(tasks).all();
    return rows.map(toTask);
  }

  findById(id: string): Task | undefined {
    const row = this.db.select().from(tasks).where(eq(tasks.id, id)).get();
    return row ? toTask(row) : undefined;
  }

  findByAssignee(assigneeId: string): Task[] {
    const rows = this.db.select().from(tasks).where(eq(tasks.assigneeId, assigneeId)).all();
    return rows.map(toTask);
  }

  findByStatus(status: string): Task[] {
    const rows = this.db.select().from(tasks).where(eq(tasks.status, status)).all();
    return rows.map(toTask);
  }

  create(input: CreateTaskInput): Task {
    const now = new Date().toISOString();
    const id = ulid();
    const row = {
      id,
      title: input.title,
      description: input.description,
      status: 'backlog' as const,
      priority: input.priority ?? ('medium' as const),
      skills: JSON.stringify(input.skills ?? []),
      assigneeId: input.assigneeId ?? null,
      departmentId: input.departmentId ?? null,
      boardCardId: input.boardCardId ?? null,
      boardConfigId: input.boardConfigId ?? null,
      estimatedMinutes: input.estimatedMinutes ?? null,
      actualMinutes: null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    };
    this.db.insert(tasks).values(row).run();
    return toTask(row);
  }

  update(id: string, input: UpdateTaskInput): Task | undefined {
    const existing = this.findById(id);
    if (!existing) return undefined;

    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (input.title !== undefined) updates.title = input.title;
    if (input.description !== undefined) updates.description = input.description;
    if (input.status !== undefined) updates.status = input.status;
    if (input.priority !== undefined) updates.priority = input.priority;
    if (input.skills !== undefined) updates.skills = JSON.stringify(input.skills);
    if (input.assigneeId !== undefined) updates.assigneeId = input.assigneeId;
    if (input.departmentId !== undefined) updates.departmentId = input.departmentId;
    if (input.estimatedMinutes !== undefined) updates.estimatedMinutes = input.estimatedMinutes;
    if (input.actualMinutes !== undefined) updates.actualMinutes = input.actualMinutes;
    if (input.completedAt !== undefined) updates.completedAt = input.completedAt;

    this.db.update(tasks).set(updates).where(eq(tasks.id, id)).run();
    return this.findById(id);
  }

  delete(id: string): boolean {
    const existing = this.findById(id);
    if (!existing) return false;
    this.db.delete(tasks).where(eq(tasks.id, id)).run();
    return true;
  }
}

function toTask(row: typeof tasks.$inferSelect): Task {
  return {
    ...row,
    skills: JSON.parse(row.skills),
    status: row.status as Task['status'],
    priority: row.priority as Task['priority'],
  };
}
