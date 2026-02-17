import { Hono } from 'hono';
import type { Orchestrator } from '@dexter/engine';

export function entityRoutes(orchestrator: Orchestrator) {
  const app = new Hono();

  app.get('/', (c) => {
    const entities = orchestrator.entityManager.getAll();
    return c.json(entities);
  });

  app.get('/:id', (c) => {
    const entity = orchestrator.entityManager.getById(c.req.param('id'));
    if (!entity) return c.json({ error: 'Entity not found' }, 404);
    return c.json(entity);
  });

  app.post('/', async (c) => {
    const body = await c.req.json();
    const entity = orchestrator.entityManager.create(body);
    return c.json(entity, 201);
  });

  app.post('/from-soul', async (c) => {
    const { soulPath, llmConfigId, departmentId } = await c.req.json();
    const entity = orchestrator.entityManager.createFromSoul(soulPath, llmConfigId, departmentId);
    return c.json(entity, 201);
  });

  app.patch('/:id', async (c) => {
    const body = await c.req.json();
    const entity = orchestrator.entityManager.update(c.req.param('id'), body);
    if (!entity) return c.json({ error: 'Entity not found' }, 404);
    return c.json(entity);
  });

  app.delete('/:id', (c) => {
    const deleted = orchestrator.entityManager.delete(c.req.param('id'));
    if (!deleted) return c.json({ error: 'Entity not found' }, 404);
    return c.json({ ok: true });
  });

  return app;
}
