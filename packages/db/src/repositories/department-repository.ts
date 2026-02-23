import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { DexterDb } from '../connection.js';
import { departments } from '../schema.js';

type DepartmentRow = typeof departments.$inferSelect;
type DepartmentInsert = typeof departments.$inferInsert;

export class DepartmentRepository {
  constructor(private db: DexterDb) {}

  findAll(): DepartmentRow[] {
    return this.db.select().from(departments).all();
  }

  findById(id: string): DepartmentRow | undefined {
    return this.db.select().from(departments).where(eq(departments.id, id)).get();
  }

  create(input: Omit<DepartmentInsert, 'id' | 'createdAt'>): DepartmentRow {
    const row: DepartmentInsert = {
      id: ulid(),
      ...input,
      createdAt: new Date().toISOString(),
    };
    this.db.insert(departments).values(row).run();
    return this.findById(row.id!)!;
  }

  update(id: string, updates: Partial<Omit<DepartmentInsert, 'id' | 'createdAt'>>): DepartmentRow | undefined {
    const existing = this.findById(id);
    if (!existing) return undefined;
    this.db.update(departments).set(updates).where(eq(departments.id, id)).run();
    return this.findById(id);
  }

  delete(id: string): void {
    this.db.delete(departments).where(eq(departments.id, id)).run();
  }
}
