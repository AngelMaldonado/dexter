import { Hono } from 'hono';
import type { Orchestrator } from '@dexter/engine';
import { DepartmentRepository } from '@dexter/db';
import type { DexterDb } from '@dexter/db';

export function officeRoutes(orchestrator: Orchestrator, db: DexterDb) {
  const app = new Hono();
  const deptRepo = new DepartmentRepository(db);

  // Get the full office state: departments with their entities
  app.get('/state', (c) => {
    const departments = deptRepo.findAll();
    const entities = orchestrator.entityManager.getAll();

    const officeState = {
      departments: departments.map(dept => ({
        ...dept,
        entities: entities.filter(e => e.departmentId === dept.id),
      })),
      unassigned: entities.filter(e => !e.departmentId),
    };

    return c.json(officeState);
  });

  return app;
}
