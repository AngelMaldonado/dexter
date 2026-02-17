import { Hono } from 'hono';
import { DepartmentRepository } from '@dexter/db';
import type { DexterDb } from '@dexter/db';

export function organizationRoutes(db: DexterDb) {
  const app = new Hono();
  const deptRepo = new DepartmentRepository(db);

  app.get('/departments', (c) => {
    return c.json(deptRepo.findAll());
  });

  app.get('/departments/:id', (c) => {
    const dept = deptRepo.findById(c.req.param('id'));
    if (!dept) return c.json({ error: 'Department not found' }, 404);
    return c.json(dept);
  });

  app.post('/departments', async (c) => {
    const body = await c.req.json();
    const dept = deptRepo.create(body);
    return c.json(dept, 201);
  });

  app.patch('/departments/:id', async (c) => {
    const body = await c.req.json();
    const dept = deptRepo.update(c.req.param('id'), body);
    if (!dept) return c.json({ error: 'Department not found' }, 404);
    return c.json(dept);
  });

  app.delete('/departments/:id', (c) => {
    const deleted = deptRepo.delete(c.req.param('id'));
    if (!deleted) return c.json({ error: 'Department not found' }, 404);
    return c.json({ ok: true });
  });

  return app;
}
