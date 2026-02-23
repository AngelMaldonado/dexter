import { eq, and } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { DexterDb } from '../connection.js';
import { entities } from '../schema.js';

type EntityRow = typeof entities.$inferSelect;
type EntityInsert = typeof entities.$inferInsert;

export class EntityRepository {
  constructor(private db: DexterDb) {}

  findAll(filters?: { departmentId?: string; state?: string; hierarchyRole?: string }): EntityRow[] {
    if (!filters) {
      return this.db.select().from(entities).all();
    }
    const conditions = [];
    if (filters.departmentId) conditions.push(eq(entities.departmentId, filters.departmentId));
    if (filters.state) conditions.push(eq(entities.state, filters.state));
    if (filters.hierarchyRole) conditions.push(eq(entities.hierarchyRole, filters.hierarchyRole));

    if (conditions.length === 0) return this.db.select().from(entities).all();
    return this.db.select().from(entities).where(and(...conditions)).all();
  }

  findById(id: string): EntityRow | undefined {
    return this.db.select().from(entities).where(eq(entities.id, id)).get();
  }

  create(input: Omit<EntityInsert, 'id' | 'createdAt' | 'updatedAt'>): EntityRow {
    const now = new Date().toISOString();
    const row: EntityInsert = {
      id: ulid(),
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    this.db.insert(entities).values(row).run();
    return this.findById(row.id!)!;
  }

  update(id: string, updates: Partial<Omit<EntityInsert, 'id' | 'createdAt'>>): EntityRow | undefined {
    const existing = this.findById(id);
    if (!existing) return undefined;
    this.db.update(entities).set({ ...updates, updatedAt: new Date().toISOString() }).where(eq(entities.id, id)).run();
    return this.findById(id);
  }

  delete(id: string): void {
    this.db.delete(entities).where(eq(entities.id, id)).run();
  }

  findByDepartment(departmentId: string): EntityRow[] {
    return this.db.select().from(entities).where(eq(entities.departmentId, departmentId)).all();
  }

  updateState(id: string, state: string): void {
    this.db.update(entities).set({ state, updatedAt: new Date().toISOString() }).where(eq(entities.id, id)).run();
  }

  updateEnergy(id: string, energy: number, mood: string): void {
    this.db.update(entities).set({ energy, mood, updatedAt: new Date().toISOString() }).where(eq(entities.id, id)).run();
  }

  updateXP(id: string, xp: number, level: number): void {
    this.db.update(entities).set({ xp, level, updatedAt: new Date().toISOString() }).where(eq(entities.id, id)).run();
  }
}
