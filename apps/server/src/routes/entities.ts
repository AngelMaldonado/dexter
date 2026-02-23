import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, or, desc } from 'drizzle-orm';
import type { Orchestrator } from '@dexter/engine';
import type { EntityRepository } from '@dexter/db';
import type { DexterDb } from '@dexter/db';
import { entities as entitiesTable, entityMemories, messages, entityAchievements, streaks, entityDailyStats } from '@dexter/db';
import { parseSoul } from '@dexter/core';

const createEntitySchema = z.object({
  name: z.string().min(1).max(100),
  soulMd: z.string().min(1),
  departmentId: z.string().optional(),
  llmConfigId: z.string().optional(),
  hierarchyRole: z.enum(['worker', 'lead', 'manager']).default('worker'),
  behaviorMode: z.enum(['autonomous', 'supervised', 'plan_only', 'review_only']).default('autonomous'),
  deskX: z.number().optional(),
  deskY: z.number().optional(),
});

const updateEntitySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  soulMd: z.string().min(1).optional(),
  departmentId: z.string().nullable().optional(),
  llmConfigId: z.string().nullable().optional(),
  hierarchyRole: z.enum(['worker', 'lead', 'manager']).optional(),
  behaviorMode: z.enum(['autonomous', 'supervised', 'plan_only', 'review_only']).optional(),
  energy: z.number().min(0).max(100).optional(),
  mood: z.enum(['happy', 'neutral', 'frustrated', 'tired', 'excited']).optional(),
  deskX: z.number().nullable().optional(),
  deskY: z.number().nullable().optional(),
  maxConcurrentTasks: z.number().min(1).optional(),
  energyDrainRate: z.number().min(0).optional(),
  energyRecoveryRate: z.number().min(0).optional(),
});

const entityActionSchema = z.object({
  action: z.enum(['start_break', 'resume', 'pause']),
});

const fromSoulSchema = z.object({
  soulMd: z.string().min(1),
  departmentId: z.string().optional(),
  llmConfigId: z.string().optional(),
});

export function entityRoutes(orchestrator: Orchestrator, entityRepo: EntityRepository, db: DexterDb) {
  const app = new Hono();

  // List entities with optional filters
  app.get('/', (c) => {
    const departmentId = c.req.query('departmentId');
    const state = c.req.query('state');
    const hierarchyRole = c.req.query('hierarchyRole');

    let allEntities = orchestrator.entityManager.getAllEntities();

    if (departmentId) allEntities = allEntities.filter(e => e.departmentId === departmentId);
    if (state) allEntities = allEntities.filter(e => e.state === state);
    if (hierarchyRole) allEntities = allEntities.filter(e => e.hierarchyRole === hierarchyRole);

    return c.json(allEntities);
  });

  // Create entity
  app.post('/', zValidator('json', createEntitySchema), async (c) => {
    const input = c.req.valid('json');
    // Create in EntityManager (in-memory with events)
    const entity = orchestrator.entityManager.createEntity(input);
    // Persist to DB
    db.insert(entitiesTable).values({
      id: entity.id,
      name: entity.name,
      soulMd: entity.soulMd,
      departmentId: entity.departmentId,
      hierarchyRole: entity.hierarchyRole,
      behaviorMode: entity.behaviorMode,
      state: entity.state,
      energy: entity.energy,
      mood: entity.mood,
      xp: entity.xp,
      level: entity.level,
      deskX: entity.deskX,
      deskY: entity.deskY,
      llmConfigId: entity.llmConfigId,
      maxConcurrentTasks: entity.maxConcurrentTasks,
      energyDrainRate: entity.energyDrainRate,
      energyRecoveryRate: entity.energyRecoveryRate,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    }).run();
    return c.json(entity, 201);
  });

  // Create entity from raw SOUL.md text
  app.post('/from-soul', zValidator('json', fromSoulSchema), async (c) => {
    const { soulMd, departmentId, llmConfigId } = c.req.valid('json');
    const soul = parseSoul(soulMd);
    const entity = orchestrator.entityManager.createEntity({
      name: soul.name,
      soulMd,
      departmentId,
      llmConfigId,
      hierarchyRole: soul.hierarchy,
    });
    // Persist to DB
    db.insert(entitiesTable).values({
      id: entity.id,
      name: entity.name,
      soulMd: entity.soulMd,
      departmentId: entity.departmentId,
      hierarchyRole: entity.hierarchyRole,
      behaviorMode: entity.behaviorMode,
      state: entity.state,
      energy: entity.energy,
      mood: entity.mood,
      xp: entity.xp,
      level: entity.level,
      deskX: entity.deskX,
      deskY: entity.deskY,
      llmConfigId: entity.llmConfigId,
      maxConcurrentTasks: entity.maxConcurrentTasks,
      energyDrainRate: entity.energyDrainRate,
      energyRecoveryRate: entity.energyRecoveryRate,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    }).run();
    return c.json(entity, 201);
  });

  // Get entity by ID
  app.get('/:id', (c) => {
    const entity = orchestrator.entityManager.getEntity(c.req.param('id'));
    if (!entity) return c.json({ error: { message: 'Entity not found', code: 'NOT_FOUND' } }, 404);
    return c.json(entity);
  });

  // Update entity
  app.patch('/:id', zValidator('json', updateEntitySchema), async (c) => {
    const id = c.req.param('id');
    const input = c.req.valid('json');
    const entity = orchestrator.entityManager.updateEntity(id, input);
    if (!entity) return c.json({ error: { message: 'Entity not found', code: 'NOT_FOUND' } }, 404);
    // Persist to DB
    entityRepo.update(id, input);
    return c.json(entity);
  });

  // Delete entity
  app.delete('/:id', (c) => {
    const id = c.req.param('id');
    const deleted = orchestrator.entityManager.deleteEntity(id);
    if (!deleted) return c.json({ error: { message: 'Entity not found', code: 'NOT_FOUND' } }, 404);
    entityRepo.delete(id);
    return c.body(null, 204);
  });

  // Get entity stats
  app.get('/:id/stats', (c) => {
    const id = c.req.param('id');
    const entity = orchestrator.entityManager.getEntity(id);
    if (!entity) return c.json({ error: { message: 'Entity not found', code: 'NOT_FOUND' } }, 404);

    const achievements = db.select().from(entityAchievements).where(eq(entityAchievements.entityId, id)).all();
    const activeStreaks = db.select().from(streaks).where(eq(streaks.entityId, id)).all();
    const dailyStats = db.select().from(entityDailyStats).where(eq(entityDailyStats.entityId, id)).orderBy(desc(entityDailyStats.date)).limit(30).all();

    return c.json({
      entityId: id,
      xp: entity.xp,
      level: entity.level,
      energy: entity.energy,
      mood: entity.mood,
      achievementsCount: achievements.length,
      achievements,
      streaks: activeStreaks,
      recentDailyStats: dailyStats,
    });
  });

  // Trigger entity action (state transition)
  app.post('/:id/action', zValidator('json', entityActionSchema), async (c) => {
    const id = c.req.param('id');
    const { action } = c.req.valid('json');

    const stateMap: Record<string, string> = {
      start_break: 'on_break',
      resume: 'idle',
      pause: 'blocked',
    };

    try {
      const entity = orchestrator.entityManager.transitionState(id, stateMap[action] as any);
      if (!entity) return c.json({ error: { message: 'Entity not found', code: 'NOT_FOUND' } }, 404);
      // Persist state to DB
      entityRepo.updateState(id, entity.state);
      return c.json(entity);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return c.json({ error: { message, code: 'INVALID_TRANSITION' } }, 400);
    }
  });

  // Get entity memories
  app.get('/:id/memories', (c) => {
    const id = c.req.param('id');
    const limit = Math.min(200, Math.max(1, parseInt(c.req.query('limit') ?? '50', 10) || 50));
    const offset = Math.max(0, parseInt(c.req.query('offset') ?? '0', 10) || 0);

    const entity = orchestrator.entityManager.getEntity(id);
    if (!entity) return c.json({ error: { message: 'Entity not found', code: 'NOT_FOUND' } }, 404);

    const memories = db.select()
      .from(entityMemories)
      .where(eq(entityMemories.entityId, id))
      .orderBy(desc(entityMemories.createdAt))
      .limit(limit)
      .offset(offset)
      .all();

    return c.json(memories);
  });

  // Get entity messages
  app.get('/:id/messages', (c) => {
    const id = c.req.param('id');
    const limit = Math.min(200, Math.max(1, parseInt(c.req.query('limit') ?? '50', 10) || 50));
    const offset = Math.max(0, parseInt(c.req.query('offset') ?? '0', 10) || 0);

    const entity = orchestrator.entityManager.getEntity(id);
    if (!entity) return c.json({ error: { message: 'Entity not found', code: 'NOT_FOUND' } }, 404);

    const msgs = db.select()
      .from(messages)
      .where(or(eq(messages.fromEntityId, id), eq(messages.toEntityId, id)))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset)
      .all();

    return c.json(msgs);
  });

  return app;
}
