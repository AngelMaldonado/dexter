import { desc, eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { DexterDb } from '../connection.js';
import { activityLog } from '../schema.js';

export interface ActivityEntry {
  id: string;
  entityId: string | null;
  type: string;
  message: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export class ActivityRepository {
  constructor(private db: DexterDb) {}

  findRecent(limit = 50): ActivityEntry[] {
    const rows = this.db.select().from(activityLog).orderBy(desc(activityLog.createdAt)).limit(limit).all();
    return rows.map(toActivity);
  }

  findByEntity(entityId: string, limit = 50): ActivityEntry[] {
    const rows = this.db
      .select()
      .from(activityLog)
      .where(eq(activityLog.entityId, entityId))
      .orderBy(desc(activityLog.createdAt))
      .limit(limit)
      .all();
    return rows.map(toActivity);
  }

  create(entry: { entityId?: string; type: string; message: string; metadata?: Record<string, unknown> }): ActivityEntry {
    const row = {
      id: ulid(),
      entityId: entry.entityId ?? null,
      type: entry.type,
      message: entry.message,
      metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
      createdAt: new Date().toISOString(),
    };
    this.db.insert(activityLog).values(row).run();
    return toActivity(row);
  }
}

function toActivity(row: typeof activityLog.$inferSelect): ActivityEntry {
  return {
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
  };
}
