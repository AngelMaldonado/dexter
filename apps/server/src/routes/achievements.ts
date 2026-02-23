import { Hono } from 'hono';
import { eq, desc, sql } from 'drizzle-orm';
import type { DexterDb } from '@dexter/db';
import { achievementDefinitions, entityAchievements, entities, streaks, tasks } from '@dexter/db';

export function achievementRoutes(db: DexterDb) {
  const app = new Hono();

  // Get achievement definitions catalog
  app.get('/', (c) => {
    const definitions = db.select().from(achievementDefinitions).all();
    return c.json(definitions);
  });

  // Leaderboard: entities ranked by XP
  app.get('/leaderboard', (c) => {
    const departmentId = c.req.query('departmentId');
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '20', 10) || 20));

    let allEntities = db.select().from(entities).orderBy(desc(entities.xp)).all();

    if (departmentId) {
      allEntities = allEntities.filter(e => e.departmentId === departmentId);
    }

    // Get task completion counts per entity
    const taskCounts = db.select({
      entityId: tasks.assignedEntityId,
      count: sql<number>`count(*)`.as('count'),
    }).from(tasks)
      .where(eq(tasks.status, 'done'))
      .groupBy(tasks.assignedEntityId)
      .all();
    const taskCountMap = new Map(taskCounts.map(tc => [tc.entityId, tc.count]));

    // Get active streak counts per entity
    const activeStreaks = db.select()
      .from(streaks)
      .where(eq(streaks.isActive, 1))
      .all();
    const streakMap = new Map<string, number>();
    for (const s of activeStreaks) {
      const current = streakMap.get(s.entityId) ?? 0;
      if (s.currentCount > current) streakMap.set(s.entityId, s.currentCount);
    }

    const leaderboard = allEntities.slice(0, limit).map((e, index) => ({
      rank: index + 1,
      entityId: e.id,
      entityName: e.name,
      departmentId: e.departmentId,
      totalXp: e.xp,
      level: e.level,
      tasksCompleted: taskCountMap.get(e.id) ?? 0,
      currentStreak: streakMap.get(e.id) ?? 0,
    }));

    return c.json(leaderboard);
  });

  // Active streaks across all entities
  app.get('/streaks', (c) => {
    const activeStreaks = db.select()
      .from(streaks)
      .where(eq(streaks.isActive, 1))
      .all();
    return c.json(activeStreaks);
  });

  return app;
}
