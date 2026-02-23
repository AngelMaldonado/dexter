import { eq, and } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { DexterDb } from '../connection.js';
import { tasks } from '../schema.js';

type TaskRow = typeof tasks.$inferSelect;
type TaskInsert = typeof tasks.$inferInsert;

export class TaskRepository {
  constructor(private db: DexterDb) {}

  findAll(filters?: { status?: string; assignedEntityId?: string; departmentId?: string }): TaskRow[] {
    if (!filters) {
      return this.db.select().from(tasks).all();
    }
    const conditions = [];
    if (filters.status) conditions.push(eq(tasks.status, filters.status));
    if (filters.assignedEntityId) conditions.push(eq(tasks.assignedEntityId, filters.assignedEntityId));
    if (filters.departmentId) conditions.push(eq(tasks.departmentId, filters.departmentId));

    if (conditions.length === 0) return this.db.select().from(tasks).all();
    return this.db.select().from(tasks).where(and(...conditions)).all();
  }

  findById(id: string): TaskRow | undefined {
    return this.db.select().from(tasks).where(eq(tasks.id, id)).get();
  }

  create(input: Omit<TaskInsert, 'id' | 'createdAt' | 'updatedAt'>): TaskRow {
    const now = new Date().toISOString();
    const row: TaskInsert = {
      id: ulid(),
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    this.db.insert(tasks).values(row).run();
    return this.findById(row.id!)!;
  }

  update(id: string, updates: Partial<Omit<TaskInsert, 'id' | 'createdAt'>>): TaskRow | undefined {
    const existing = this.findById(id);
    if (!existing) return undefined;
    this.db.update(tasks).set({ ...updates, updatedAt: new Date().toISOString() }).where(eq(tasks.id, id)).run();
    return this.findById(id);
  }

  delete(id: string): void {
    this.db.delete(tasks).where(eq(tasks.id, id)).run();
  }

  findByStatus(status: string): TaskRow[] {
    return this.db.select().from(tasks).where(eq(tasks.status, status)).all();
  }

  findByAssignee(entityId: string): TaskRow[] {
    return this.db.select().from(tasks).where(eq(tasks.assignedEntityId, entityId)).all();
  }

  findSubTasks(parentTaskId: string): TaskRow[] {
    return this.db.select().from(tasks).where(eq(tasks.parentTaskId, parentTaskId)).all();
  }

  assign(taskId: string, entityId: string): void {
    this.db.update(tasks).set({ assignedEntityId: entityId, status: 'todo', updatedAt: new Date().toISOString() }).where(eq(tasks.id, taskId)).run();
  }

  complete(taskId: string): void {
    const now = new Date().toISOString();
    this.db.update(tasks).set({ status: 'done', completedAt: now, updatedAt: now }).where(eq(tasks.id, taskId)).run();
  }

  fail(taskId: string): void {
    const now = new Date().toISOString();
    this.db.update(tasks).set({ status: 'failed', completedAt: now, updatedAt: now }).where(eq(tasks.id, taskId)).run();
  }
}
