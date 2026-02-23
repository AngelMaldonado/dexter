import { eq, and, sql } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { DexterDb } from '../connection.js';
import { entityMemories } from '../schema.js';

type MemoryRow = typeof entityMemories.$inferSelect;
type MemoryInsert = typeof entityMemories.$inferInsert;

export class MemoryRepository {
  constructor(private db: DexterDb) {}

  findByEntity(entityId: string): MemoryRow[] {
    return this.db.select().from(entityMemories).where(eq(entityMemories.entityId, entityId)).all();
  }

  findRelevant(entityId: string, keywords: string[]): MemoryRow[] {
    if (keywords.length === 0) return this.findByEntity(entityId);

    // Search across relevance_keywords JSON array for any matching keyword
    const conditions = keywords.map(
      (kw) => sql`${entityMemories.relevanceKeywords} LIKE ${'%' + kw + '%'}`
    );
    const keywordCondition = sql.join(conditions, sql` OR `);

    return this.db
      .select()
      .from(entityMemories)
      .where(and(eq(entityMemories.entityId, entityId), keywordCondition))
      .all();
  }

  create(input: Omit<MemoryInsert, 'id' | 'createdAt'>): MemoryRow {
    const row: MemoryInsert = {
      id: ulid(),
      ...input,
      createdAt: new Date().toISOString(),
    };
    this.db.insert(entityMemories).values(row).run();
    return this.findById(row.id!)!;
  }

  delete(id: string): void {
    this.db.delete(entityMemories).where(eq(entityMemories.id, id)).run();
  }

  private findById(id: string): MemoryRow | undefined {
    return this.db.select().from(entityMemories).where(eq(entityMemories.id, id)).get();
  }
}
