import { Hono } from 'hono';
import type { Orchestrator } from '@dexter/engine';

export function activityRoutes(orchestrator: Orchestrator) {
  const app = new Hono();
  const activityRepo = orchestrator.getActivityRepo();

  app.get('/', (c) => {
    const limit = parseInt(c.req.query('limit') ?? '50', 10);
    const entries = activityRepo.findRecent(limit);
    return c.json(entries);
  });

  app.get('/entity/:entityId', (c) => {
    const limit = parseInt(c.req.query('limit') ?? '50', 10);
    const entries = activityRepo.findByEntity(c.req.param('entityId'), limit);
    return c.json(entries);
  });

  return app;
}
