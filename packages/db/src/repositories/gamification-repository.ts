import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { DexterDb } from '../connection.js';
import {
  achievementDefinitions,
  entityAchievements,
  entityDailyStats,
  xpEvents,
  streaks,
  entities,
} from '../schema.js';

type AchievementDefRow = typeof achievementDefinitions.$inferSelect;
type EntityAchievementRow = typeof entityAchievements.$inferSelect;
type DailyStatsRow = typeof entityDailyStats.$inferSelect;
type XPEventRow = typeof xpEvents.$inferSelect;
type StreakRow = typeof streaks.$inferSelect;

export interface LeaderboardEntry {
  entityId: string;
  entityName: string;
  xp: number;
  level: number;
  achievementCount: number;
}

export class GamificationRepository {
  constructor(private db: DexterDb) {}

  // ─── Leaderboard ─────────────────────────────────────────────────
  getLeaderboard(filters?: { departmentId?: string; timeRange?: { start: string; end: string } }): LeaderboardEntry[] {
    let query = this.db
      .select({
        entityId: entities.id,
        entityName: entities.name,
        xp: entities.xp,
        level: entities.level,
      })
      .from(entities);

    if (filters?.departmentId) {
      query = query.where(eq(entities.departmentId, filters.departmentId)) as typeof query;
    }

    const rows = query.orderBy(desc(entities.xp)).all();

    return rows.map((row) => {
      const achievementCount = this.db
        .select({ count: sql<number>`count(*)` })
        .from(entityAchievements)
        .where(eq(entityAchievements.entityId, row.entityId))
        .get();
      return {
        ...row,
        achievementCount: achievementCount?.count ?? 0,
      };
    });
  }

  // ─── Achievements ────────────────────────────────────────────────
  getEntityAchievements(entityId: string): (EntityAchievementRow & { definition: AchievementDefRow })[] {
    const rows = this.db
      .select()
      .from(entityAchievements)
      .where(eq(entityAchievements.entityId, entityId))
      .all();

    return rows.map((row) => {
      const definition = this.db
        .select()
        .from(achievementDefinitions)
        .where(eq(achievementDefinitions.id, row.achievementId))
        .get()!;
      return { ...row, definition };
    });
  }

  unlockAchievement(entityId: string, achievementId: string): void {
    this.db
      .insert(entityAchievements)
      .values({
        entityId,
        achievementId,
        unlockedAt: new Date().toISOString(),
      })
      .run();
  }

  getAchievementDefinitions(): AchievementDefRow[] {
    return this.db.select().from(achievementDefinitions).all();
  }

  createAchievementDefinition(input: Omit<typeof achievementDefinitions.$inferInsert, 'id' | 'createdAt'>): AchievementDefRow {
    const row = {
      id: ulid(),
      ...input,
      createdAt: new Date().toISOString(),
    };
    this.db.insert(achievementDefinitions).values(row).run();
    return this.db.select().from(achievementDefinitions).where(eq(achievementDefinitions.id, row.id)).get()!;
  }

  // ─── Streaks ─────────────────────────────────────────────────────
  getStreaks(entityId: string): StreakRow[] {
    return this.db.select().from(streaks).where(eq(streaks.entityId, entityId)).all();
  }

  updateStreak(id: string, updates: Partial<Omit<typeof streaks.$inferInsert, 'id' | 'createdAt'>>): void {
    this.db.update(streaks).set(updates).where(eq(streaks.id, id)).run();
  }

  createStreak(input: Omit<typeof streaks.$inferInsert, 'id' | 'createdAt'>): StreakRow {
    const row = {
      id: ulid(),
      ...input,
      createdAt: new Date().toISOString(),
    };
    this.db.insert(streaks).values(row).run();
    return this.db.select().from(streaks).where(eq(streaks.id, row.id)).get()!;
  }

  // ─── XP Events ──────────────────────────────────────────────────
  createXPEvent(input: Omit<typeof xpEvents.$inferInsert, 'id' | 'createdAt'>): XPEventRow {
    const row = {
      id: ulid(),
      ...input,
      createdAt: new Date().toISOString(),
    };
    this.db.insert(xpEvents).values(row).run();
    return this.db.select().from(xpEvents).where(eq(xpEvents.id, row.id)).get()!;
  }

  // ─── Daily Stats ────────────────────────────────────────────────
  getDailyStats(entityId: string, date: string): DailyStatsRow | undefined {
    return this.db
      .select()
      .from(entityDailyStats)
      .where(and(eq(entityDailyStats.entityId, entityId), eq(entityDailyStats.date, date)))
      .get();
  }

  upsertDailyStats(
    entityId: string,
    date: string,
    updates: Partial<Pick<typeof entityDailyStats.$inferInsert, 'tasksCompleted' | 'tokensUsed' | 'cost' | 'activeTimeMinutes' | 'xpEarned'>>,
  ): void {
    const existing = this.getDailyStats(entityId, date);
    if (existing) {
      this.db
        .update(entityDailyStats)
        .set(updates)
        .where(eq(entityDailyStats.id, existing.id))
        .run();
    } else {
      this.db
        .insert(entityDailyStats)
        .values({
          id: ulid(),
          entityId,
          date,
          ...updates,
        })
        .run();
    }
  }
}
