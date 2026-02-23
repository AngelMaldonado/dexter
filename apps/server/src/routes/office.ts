import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Orchestrator } from '@dexter/engine';
import type { DepartmentRepository } from '@dexter/db';

const updateLayoutSchema = z.object({
  width: z.number().optional(),
  height: z.number().optional(),
  meetingRooms: z.array(z.object({
    id: z.string(),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    name: z.string(),
  })).optional(),
});

export function officeRoutes(orchestrator: Orchestrator, deptRepo: DepartmentRepository) {
  const app = new Hono();

  // Get full office layout
  app.get('/layout', (c) => {
    const departments = deptRepo.findAll();
    const entities = orchestrator.entityManager.getAllEntities();

    // Grid dimensions in tiles (not pixels)
    const GRID_W = 20;
    const GRID_H = 16;

    const layout = {
      width: GRID_W,
      height: GRID_H,
      departments: departments.map((dept: any) => ({
        departmentId: dept.id,
        name: dept.name,
        color: dept.color,
        zone: {
          x: dept.floorZoneX ?? 0,
          y: dept.floorZoneY ?? 0,
          width: dept.floorZoneWidth ?? 4,
          height: dept.floorZoneHeight ?? 4,
        },
      })),
      desks: entities
        .filter(e => e.deskX != null && e.deskY != null)
        .map(e => ({
          x: e.deskX!,
          y: e.deskY!,
          entityId: e.id,
        })),
      meetingRooms: [],
    };

    return c.json(layout);
  });

  // Update layout
  app.patch('/layout', zValidator('json', updateLayoutSchema), async (c) => {
    const input = c.req.valid('json');
    return c.json({ updated: true, ...input });
  });

  // Get live entity positions and states
  app.get('/state', (c) => {
    const departments = deptRepo.findAll();
    const entities = orchestrator.entityManager.getAllEntities();

    const officeState = {
      departments: departments.map((dept: any) => ({
        ...dept,
        entities: entities.filter(e => e.departmentId === dept.id).map(e => ({
          id: e.id,
          name: e.name,
          state: e.state,
          mood: e.mood,
          energy: e.energy,
          deskX: e.deskX,
          deskY: e.deskY,
          hierarchyRole: e.hierarchyRole,
        })),
      })),
      unassigned: entities.filter(e => !e.departmentId).map(e => ({
        id: e.id,
        name: e.name,
        state: e.state,
        mood: e.mood,
        energy: e.energy,
        deskX: e.deskX,
        deskY: e.deskY,
        hierarchyRole: e.hierarchyRole,
      })),
    };

    return c.json(officeState);
  });

  return app;
}
