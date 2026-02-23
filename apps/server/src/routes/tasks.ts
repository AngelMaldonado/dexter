import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Orchestrator } from '@dexter/engine';
import type { TaskRepository, ExecutionRepository } from '@dexter/db';
import type { Task, TaskStatus, TaskPriority } from '@dexter/core';

const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().default(''),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  requiredSkills: z.union([z.string(), z.array(z.string())]).default('[]'),
  assignedEntityId: z.string().optional(),
  parentTaskId: z.string().optional(),
  departmentId: z.string().optional(),
  boardCardId: z.string().optional(),
  boardProviderId: z.string().optional(),
  estimatedEffort: z.number().min(0).default(5),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'review', 'done', 'failed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  requiredSkills: z.union([z.string(), z.array(z.string())]).optional(),
  assignedEntityId: z.string().nullable().optional(),
  parentTaskId: z.string().nullable().optional(),
  departmentId: z.string().nullable().optional(),
  estimatedEffort: z.number().min(0).optional(),
  completedAt: z.string().nullable().optional(),
});

const assignTaskSchema = z.object({
  entityId: z.string().optional(),
});

/** Convert a DB task row to the core Task type (parse JSON fields) */
function toTask(row: any): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    status: row.status as TaskStatus,
    priority: row.priority as TaskPriority,
    requiredSkills: typeof row.requiredSkills === 'string'
      ? JSON.parse(row.requiredSkills || '[]')
      : (row.requiredSkills ?? []),
    assignedEntityId: row.assignedEntityId ?? null,
    parentTaskId: row.parentTaskId ?? null,
    departmentId: row.departmentId ?? null,
    boardCardId: row.boardCardId ?? null,
    boardProviderId: row.boardProviderId ?? null,
    estimatedEffort: row.estimatedEffort ?? 5,
    actualTokensUsed: row.actualTokensUsed ?? 0,
    actualCost: row.actualCost ?? 0,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    completedAt: row.completedAt ?? null,
  };
}

export function taskRoutes(orchestrator: Orchestrator, taskRepo: TaskRepository, executionRepo: ExecutionRepository) {
  const app = new Hono();

  // List tasks
  app.get('/', (c) => {
    const status = c.req.query('status');
    const assignedEntityId = c.req.query('assignedEntityId');
    const departmentId = c.req.query('departmentId');
    const parentTaskId = c.req.query('parentTaskId');

    const filters: Record<string, string> = {};
    if (status) filters.status = status;
    if (assignedEntityId) filters.assignedEntityId = assignedEntityId;
    if (departmentId) filters.departmentId = departmentId;

    let tasks = taskRepo.findAll(Object.keys(filters).length > 0 ? filters : undefined);

    if (parentTaskId) {
      tasks = tasks.filter((t: any) => t.parentTaskId === parentTaskId);
    }

    return c.json(tasks.map(toTask));
  });

  // Create task
  app.post('/', zValidator('json', createTaskSchema), async (c) => {
    const input = c.req.valid('json');
    // Normalize requiredSkills to JSON string for DB storage
    const normalized = {
      ...input,
      requiredSkills: Array.isArray(input.requiredSkills)
        ? JSON.stringify(input.requiredSkills)
        : input.requiredSkills,
    };
    const task = toTask(taskRepo.create(normalized));
    orchestrator.eventBus.emit({
      type: 'task:created',
      timestamp: new Date().toISOString(),
      payload: { task },
    });
    return c.json(task, 201);
  });

  // Get task by ID
  app.get('/:id', (c) => {
    const task = taskRepo.findById(c.req.param('id'));
    if (!task) return c.json({ error: { message: 'Task not found', code: 'NOT_FOUND' } }, 404);
    return c.json(toTask(task));
  });

  // Update task
  app.patch('/:id', zValidator('json', updateTaskSchema), async (c) => {
    const input = c.req.valid('json');
    if (Array.isArray(input.requiredSkills)) {
      (input as any).requiredSkills = JSON.stringify(input.requiredSkills);
    }
    const task = taskRepo.update(c.req.param('id'), input as any);
    if (!task) return c.json({ error: { message: 'Task not found', code: 'NOT_FOUND' } }, 404);
    return c.json(toTask(task));
  });

  // Delete task
  app.delete('/:id', (c) => {
    const existing = taskRepo.findById(c.req.param('id'));
    if (!existing) return c.json({ error: { message: 'Task not found', code: 'NOT_FOUND' } }, 404);
    taskRepo.delete(c.req.param('id'));
    return c.body(null, 204);
  });

  // Assign task to entity and execute
  app.post('/:id/assign', zValidator('json', assignTaskSchema), async (c) => {
    const { entityId } = c.req.valid('json');
    const taskRow = taskRepo.findById(c.req.param('id'));
    if (!taskRow) return c.json({ error: { message: 'Task not found', code: 'NOT_FOUND' } }, 404);

    try {
      // Convert DB row to core Task type for the engine
      const task = toTask(taskRow);
      const result = await orchestrator.assignAndExecute(task, entityId);
      // Update task status in DB
      taskRepo.update(task.id, { status: 'done', completedAt: new Date().toISOString() });
      return c.json({ result });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Task assign failed [${c.req.param('id')}]:`, message);
      // Emit failure event so it shows in activity log
      orchestrator.eventBus.emit({
        type: 'task:failed',
        timestamp: new Date().toISOString(),
        payload: { taskId: c.req.param('id'), entityId: entityId ?? 'unassigned', error: message },
      });
      // Update task status to failed on error
      taskRepo.update(c.req.param('id'), { status: 'failed' });
      return c.json({ error: { message, code: 'ASSIGN_FAILED' } }, 400);
    }
  });

  // Get execution runs for task
  app.get('/:id/runs', (c) => {
    const task = taskRepo.findById(c.req.param('id'));
    if (!task) return c.json({ error: { message: 'Task not found', code: 'NOT_FOUND' } }, 404);
    const runs = executionRepo.findByTask(c.req.param('id'));
    return c.json(runs);
  });

  return app;
}
