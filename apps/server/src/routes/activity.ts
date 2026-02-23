import { Hono } from 'hono';
import type { ActivityRepository } from '@dexter/db';

export function activityRoutes(activityRepo: ActivityRepository) {
  const app = new Hono();

  // Recent activity log
  app.get('/', (c) => {
    const limit = Math.min(200, Math.max(1, parseInt(c.req.query('limit') ?? '50', 10) || 50));
    const entityId = c.req.query('entityId');
    const eventType = c.req.query('eventType');

    let entries = entityId
      ? activityRepo.findByEntity(entityId, limit)
      : activityRepo.findRecent(limit);

    if (eventType) {
      entries = entries.filter((e: any) => e.eventType === eventType);
    }

    return c.json(entries);
  });

  // Activity for specific entity
  app.get('/entity/:id', (c) => {
    const limit = Math.min(200, Math.max(1, parseInt(c.req.query('limit') ?? '50', 10) || 50));
    const entries = activityRepo.findByEntity(c.req.param('id'), limit);
    return c.json(entries);
  });

  return app;
}
