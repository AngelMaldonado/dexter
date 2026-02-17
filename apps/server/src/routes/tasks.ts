import { Hono } from 'hono';
import type { Orchestrator } from '@dexter/engine';

export function taskRoutes(orchestrator: Orchestrator) {
  const app = new Hono();
  const taskRepo = orchestrator.getTaskRepo();

  app.get('/', (c) => {
    const status = c.req.query('status');
    const tasks = status ? taskRepo.findByStatus(status) : taskRepo.findAll();
    return c.json(tasks);
  });

  app.get('/:id', (c) => {
    const task = taskRepo.findById(c.req.param('id'));
    if (!task) return c.json({ error: 'Task not found' }, 404);
    return c.json(task);
  });

  app.post('/', async (c) => {
    const body = await c.req.json();
    const task = taskRepo.create(body);
    orchestrator.eventBus.emit({
      type: 'task:created',
      task,
      timestamp: new Date().toISOString(),
    });
    return c.json(task, 201);
  });

  app.patch('/:id', async (c) => {
    const body = await c.req.json();
    const task = taskRepo.update(c.req.param('id'), body);
    if (!task) return c.json({ error: 'Task not found' }, 404);
    return c.json(task);
  });

  app.delete('/:id', (c) => {
    const deleted = taskRepo.delete(c.req.param('id'));
    if (!deleted) return c.json({ error: 'Task not found' }, 404);
    return c.json({ ok: true });
  });

  app.post('/:id/assign', async (c) => {
    const { entityId } = await c.req.json().catch(() => ({ entityId: undefined }));
    try {
      const result = await orchestrator.assignAndExecute(c.req.param('id'), entityId);
      return c.json({ result });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return c.json({ error: message }, 400);
    }
  });

  return app;
}
