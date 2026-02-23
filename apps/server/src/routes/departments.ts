import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, sql } from 'drizzle-orm';
import { DepartmentRepository, EntityRepository } from '@dexter/db';
import type { DexterDb } from '@dexter/db';
import { tasks } from '@dexter/db';

const createDepartmentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().default(''),
  color: z.string().default('#6366f1'),
  floorZoneX: z.number().default(0),
  floorZoneY: z.number().default(0),
  floorZoneWidth: z.number().default(200),
  floorZoneHeight: z.number().default(200),
});

const updateDepartmentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  floorZoneX: z.number().optional(),
  floorZoneY: z.number().optional(),
  floorZoneWidth: z.number().optional(),
  floorZoneHeight: z.number().optional(),
});

export function departmentRoutes(db: DexterDb) {
  const app = new Hono();
  const deptRepo = new DepartmentRepository(db);
  const entityRepo = new EntityRepository(db);

  // List departments
  app.get('/', (c) => {
    return c.json(deptRepo.findAll());
  });

  // Create department
  app.post('/', zValidator('json', createDepartmentSchema), async (c) => {
    const input = c.req.valid('json');
    const dept = deptRepo.create(input);
    return c.json(dept, 201);
  });

  // Get department by ID
  app.get('/:id', (c) => {
    const dept = deptRepo.findById(c.req.param('id'));
    if (!dept) return c.json({ error: { message: 'Department not found', code: 'NOT_FOUND' } }, 404);
    return c.json(dept);
  });

  // Update department
  app.patch('/:id', zValidator('json', updateDepartmentSchema), async (c) => {
    const input = c.req.valid('json');
    const dept = deptRepo.update(c.req.param('id'), input);
    if (!dept) return c.json({ error: { message: 'Department not found', code: 'NOT_FOUND' } }, 404);
    return c.json(dept);
  });

  // Delete department
  app.delete('/:id', (c) => {
    const existing = deptRepo.findById(c.req.param('id'));
    if (!existing) return c.json({ error: { message: 'Department not found', code: 'NOT_FOUND' } }, 404);
    deptRepo.delete(c.req.param('id'));
    return c.body(null, 204);
  });

  // Get entities in department
  app.get('/:id/entities', (c) => {
    const dept = deptRepo.findById(c.req.param('id'));
    if (!dept) return c.json({ error: { message: 'Department not found', code: 'NOT_FOUND' } }, 404);
    const entities = entityRepo.findByDepartment(c.req.param('id'));
    return c.json(entities);
  });

  // Get department aggregated stats
  app.get('/:id/stats', (c) => {
    const id = c.req.param('id');
    const dept = deptRepo.findById(id);
    if (!dept) return c.json({ error: { message: 'Department not found', code: 'NOT_FOUND' } }, 404);

    const entities = entityRepo.findByDepartment(id);
    const deptTasks = db.select().from(tasks).where(eq(tasks.departmentId, id)).all();

    const totalXp = entities.reduce((sum, e) => sum + e.xp, 0);
    const avgEnergy = entities.length > 0 ? Math.round(entities.reduce((sum, e) => sum + e.energy, 0) / entities.length) : 0;

    return c.json({
      departmentId: id,
      entityCount: entities.length,
      totalXp,
      averageEnergy: avgEnergy,
      tasksByStatus: {
        backlog: deptTasks.filter(t => t.status === 'backlog').length,
        todo: deptTasks.filter(t => t.status === 'todo').length,
        in_progress: deptTasks.filter(t => t.status === 'in_progress').length,
        review: deptTasks.filter(t => t.status === 'review').length,
        done: deptTasks.filter(t => t.status === 'done').length,
        failed: deptTasks.filter(t => t.status === 'failed').length,
      },
    });
  });

  return app;
}
