import { Hono } from 'hono';
import type { Orchestrator } from '@dexter/engine';
import type { TaskRepository } from '@dexter/db';

export function orchestratorRoutes(orchestrator: Orchestrator, taskRepo: TaskRepository) {
  const app = new Hono();

  // Get orchestrator status
  app.get('/status', (c) => {
    const entities = orchestrator.entityManager.getAllEntities();
    const allTasks = taskRepo.findAll();

    return c.json({
      running: true,
      activeEntities: entities.filter(e => e.state === 'working' || e.state === 'thinking').length,
      totalEntities: entities.length,
      activeTasks: allTasks.filter((t: any) => t.status === 'in_progress').length,
      totalTasks: allTasks.length,
      tasksByStatus: {
        backlog: allTasks.filter((t: any) => t.status === 'backlog').length,
        todo: allTasks.filter((t: any) => t.status === 'todo').length,
        in_progress: allTasks.filter((t: any) => t.status === 'in_progress').length,
        review: allTasks.filter((t: any) => t.status === 'review').length,
        done: allTasks.filter((t: any) => t.status === 'done').length,
        failed: allTasks.filter((t: any) => t.status === 'failed').length,
      },
      entityStates: {
        idle: entities.filter(e => e.state === 'idle').length,
        working: entities.filter(e => e.state === 'working').length,
        thinking: entities.filter(e => e.state === 'thinking').length,
        blocked: entities.filter(e => e.state === 'blocked').length,
        on_break: entities.filter(e => e.state === 'on_break').length,
        collaborating: entities.filter(e => e.state === 'collaborating').length,
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Start orchestrator
  app.post('/start', (c) => {
    return c.json({ status: 'started', timestamp: new Date().toISOString() });
  });

  // Pause orchestrator
  app.post('/pause', (c) => {
    return c.json({ status: 'paused', timestamp: new Date().toISOString() });
  });

  // Resume orchestrator
  app.post('/resume', (c) => {
    return c.json({ status: 'resumed', timestamp: new Date().toISOString() });
  });

  return app;
}
