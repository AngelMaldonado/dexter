import { desc, eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { DexterDb } from '../connection.js';
import { activityLog } from '../schema.js';

type ActivityRow = typeof activityLog.$inferSelect;
type ActivityInsert = typeof activityLog.$inferInsert;

export class ActivityRepository {
  constructor(private db: DexterDb) {}

  findRecent(limit = 50): ActivityRow[] {
    return this.db.select().from(activityLog).orderBy(desc(activityLog.createdAt)).limit(limit).all();
  }

  findByEntity(entityId: string, limit = 50): ActivityRow[] {
    return this.db
      .select()
      .from(activityLog)
      .where(eq(activityLog.entityId, entityId))
      .orderBy(desc(activityLog.createdAt))
      .limit(limit)
      .all();
  }

  create(entry: Omit<ActivityInsert, 'id' | 'createdAt'>): ActivityRow {
    const row: ActivityInsert = {
      id: ulid(),
      ...entry,
      createdAt: new Date().toISOString(),
    };
    this.db.insert(activityLog).values(row).run();
    return this.findById(row.id!)!;
  }

  private findById(id: string): ActivityRow | undefined {
    return this.db.select().from(activityLog).where(eq(activityLog.id, id)).get();
  }
}
