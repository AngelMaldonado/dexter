import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { CreateDepartmentInput, Department, UpdateDepartmentInput } from '@dexter/core';
import type { DexterDb } from '../connection.js';
import { departments } from '../schema.js';

export class DepartmentRepository {
  constructor(private db: DexterDb) {}

  findAll(): Department[] {
    return this.db.select().from(departments).all();
  }

  findById(id: string): Department | undefined {
    return this.db.select().from(departments).where(eq(departments.id, id)).get();
  }

  create(input: CreateDepartmentInput): Department {
    const now = new Date().toISOString();
    const row = {
      id: ulid(),
      name: input.name,
      description: input.description,
      color: input.color ?? '#6366f1',
      createdAt: now,
      updatedAt: now,
    };
    this.db.insert(departments).values(row).run();
    return row;
  }

  update(id: string, input: UpdateDepartmentInput): Department | undefined {
    const existing = this.findById(id);
    if (!existing) return undefined;

    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (input.name !== undefined) updates.name = input.name;
    if (input.description !== undefined) updates.description = input.description;
    if (input.color !== undefined) updates.color = input.color;

    this.db.update(departments).set(updates).where(eq(departments.id, id)).run();
    return this.findById(id);
  }

  delete(id: string): boolean {
    const existing = this.findById(id);
    if (!existing) return false;
    this.db.delete(departments).where(eq(departments.id, id)).run();
    return true;
  }
}
