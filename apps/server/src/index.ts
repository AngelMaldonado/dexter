import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { initializeDatabase, llmConfigs } from '@dexter/db';
import { EntityRepository, TaskRepository, DepartmentRepository, ActivityRepository, ExecutionRepository, ConfigRepository } from '@dexter/db';
import { Orchestrator } from '@dexter/engine';
import { createLLMProvider } from '@dexter/providers';
import { parseSoul } from '@dexter/core';
import type { Entity, EntityState, HierarchyRole, BehaviorMode, Mood, LLMConfig } from '@dexter/core';
import { errorHandler } from './middleware/error-handler.js';
import { createEventRoutes } from './sse/broadcast.js';
import { entityRoutes } from './routes/entities.js';
import { taskRoutes } from './routes/tasks.js';
import { departmentRoutes } from './routes/departments.js';
import { officeRoutes } from './routes/office.js';
import { achievementRoutes } from './routes/achievements.js';
import { activityRoutes } from './routes/activity.js';
import { orchestratorRoutes } from './routes/orchestrator.js';
import { boardRoutes } from './routes/boards.js';
import { llmProviderRoutes } from './routes/llm-providers.js';
import { mcpServerRoutes } from './routes/mcp-servers.js';

// Initialize database
const db = initializeDatabase();

// Create repositories
const entityRepo = new EntityRepository(db);
const taskRepo = new TaskRepository(db);
const deptRepo = new DepartmentRepository(db);
const activityRepo = new ActivityRepository(db);
const executionRepo = new ExecutionRepository(db);

// Initialize orchestrator (in-memory engine, no DB dependency)
const orchestrator = new Orchestrator();

// Load existing entities from DB into the in-memory EntityManager
const dbRows = entityRepo.findAll();
const loadedEntities: Entity[] = dbRows.map(row => ({
  id: row.id,
  name: row.name,
  soulMd: row.soulMd,
  parsedSoul: parseSoul(row.soulMd),
  departmentId: row.departmentId ?? null,
  hierarchyRole: (row.hierarchyRole ?? 'worker') as HierarchyRole,
  behaviorMode: (row.behaviorMode ?? 'autonomous') as BehaviorMode,
  state: (row.state ?? 'idle') as EntityState,
  energy: row.energy ?? 100,
  mood: (row.mood ?? 'neutral') as Mood,
  xp: row.xp ?? 0,
  level: row.level ?? 1,
  deskX: row.deskX ?? null,
  deskY: row.deskY ?? null,
  llmConfigId: row.llmConfigId ?? null,
  maxConcurrentTasks: row.maxConcurrentTasks ?? 1,
  energyDrainRate: row.energyDrainRate ?? 10,
  energyRecoveryRate: row.energyRecoveryRate ?? 5,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
}));
orchestrator.entityManager.loadEntities(loadedEntities);

// Auto-assign desk positions to entities loaded without one
{
  const allEntities = orchestrator.entityManager.getAllEntities();
  const occupied = new Set(
    allEntities.filter(e => e.deskX !== null && e.deskY !== null)
      .map(e => `${e.deskX}:${e.deskY}`)
  );
  let nextIdx = 0;
  for (const entity of allEntities) {
    if (entity.deskX !== null && entity.deskY !== null) continue;
    let x: number, y: number;
    do {
      x = 3 + (nextIdx % 8) * 2;
      y = 3 + Math.floor(nextIdx / 8) * 2;
      nextIdx++;
    } while (occupied.has(`${x}:${y}`));
    occupied.add(`${x}:${y}`);
    orchestrator.entityManager.updateEntity(entity.id, { deskX: x, deskY: y });
    entityRepo.update(entity.id, { deskX: x, deskY: y });
  }
}

// Load LLM providers from DB into orchestrator
{
  const configs = db.select().from(llmConfigs).all();
  for (const cfg of configs) {
    if (!cfg.apiKey) continue;
    try {
      const provider = createLLMProvider(cfg as LLMConfig);
      orchestrator.registerLLMProvider(cfg.id, provider, configs.length === 1);
      console.log(`Registered LLM provider: ${cfg.name} (${cfg.provider}/${cfg.model})`);
    } catch (err) {
      console.error(`Failed to register LLM provider ${cfg.name}:`, err);
    }
  }
}

// Wire event bus to activity log
orchestrator.eventBus.onAny((event) => {
  try {
    const e = event as any;
    let description = '';
    let entityId: string | undefined;
    let taskId: string | undefined;

    switch (e.type) {
      case 'entity:created':
        entityId = e.payload?.entity?.id;
        description = `Entity "${e.payload?.entity?.name}" created`;
        break;
      case 'entity:state-changed':
        entityId = e.payload?.entityId;
        description = `Entity state: ${e.payload?.previousState} → ${e.payload?.newState}`;
        break;
      case 'task:assigned':
        entityId = e.payload?.entityId;
        taskId = e.payload?.taskId;
        description = `Task assigned to entity`;
        break;
      case 'task:created':
        taskId = e.payload?.task?.id;
        description = `Task "${e.payload?.task?.title}" created`;
        break;
      case 'task:completed':
        entityId = e.payload?.entityId;
        taskId = e.payload?.taskId;
        description = `Task completed successfully`;
        break;
      case 'task:failed':
        entityId = e.payload?.entityId;
        taskId = e.payload?.taskId;
        description = `Task failed: ${e.payload?.error ?? 'unknown error'}`;
        break;
      default:
        description = `Event: ${e.type}`;
        break;
    }

    if (description) {
      activityRepo.create({
        eventType: e.type,
        entityId: entityId ?? null,
        taskId: taskId ?? null,
        description,
        metadata: JSON.stringify(e.payload ?? {}),
      });
    }
  } catch {
    // Don't let activity logging break the system
  }
});

// Create Hono app
const app = new Hono();

// Global middleware
app.use('*', errorHandler);
app.use('*', logger());
app.use('*', cors({ origin: ['http://localhost:5173', 'http://localhost:5174'] }));

// Mount API v1 routes
app.route('/api/v1/entities', entityRoutes(orchestrator, entityRepo, db));
app.route('/api/v1/tasks', taskRoutes(orchestrator, taskRepo, executionRepo));
app.route('/api/v1/departments', departmentRoutes(db));
app.route('/api/v1/office', officeRoutes(orchestrator, deptRepo));
app.route('/api/v1/achievements', achievementRoutes(db));
app.route('/api/v1/activity', activityRoutes(activityRepo));
app.route('/api/v1/orchestrator', orchestratorRoutes(orchestrator, taskRepo));
app.route('/api/v1/boards', boardRoutes(db));
app.route('/api/v1/llm-providers', llmProviderRoutes(db));
app.route('/api/v1/mcp-servers', mcpServerRoutes(db));
app.route('/api/v1/events', createEventRoutes(orchestrator.eventBus));

// Org config routes
const configRepo = new ConfigRepository(db);
app.get('/api/v1/org', (c) => {
  const org = configRepo.getOrgConfig();
  if (!org) return c.json({ id: '', name: 'Dexter Organization', conventions: '', updatedAt: new Date().toISOString() });
  return c.json(org);
});
app.patch('/api/v1/org', async (c) => {
  const updates = await c.req.json();
  configRepo.updateOrgConfig(updates);
  const org = configRepo.getOrgConfig();
  return c.json(org);
});

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

const port = parseInt(process.env.PORT ?? '3000', 10);

export default {
  port,
  fetch: app.fetch,
  idleTimeout: 255, // Max value — prevents Bun from killing SSE connections
};

console.log(`Dexter server running on http://localhost:${port}`);
console.log(`SSE stream available at http://localhost:${port}/api/v1/events/stream`);
