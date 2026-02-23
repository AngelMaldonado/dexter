import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import type { DexterDb } from '@dexter/db';
import { boardConfigs } from '@dexter/db';
import { generateId } from '@dexter/core';

const createBoardSchema = z.object({
  name: z.string().min(1).max(100),
  providerType: z.string().min(1),
  credentials: z.string().default('{}'),
  boardId: z.string().min(1),
  pollIntervalMs: z.number().default(60000),
  listMapping: z.string().default('{}'),
  isActive: z.number().default(1),
});

const updateBoardSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  providerType: z.string().optional(),
  credentials: z.string().optional(),
  boardId: z.string().optional(),
  pollIntervalMs: z.number().optional(),
  listMapping: z.string().optional(),
  isActive: z.number().optional(),
});

export function boardRoutes(db: DexterDb) {
  const app = new Hono();

  // List board configs
  app.get('/', (c) => {
    const configs = db.select().from(boardConfigs).all();
    return c.json(configs);
  });

  // Create board config
  app.post('/', zValidator('json', createBoardSchema), async (c) => {
    const input = c.req.valid('json');
    const id = generateId();
    db.insert(boardConfigs).values({
      id,
      ...input,
      createdAt: new Date().toISOString(),
    }).run();
    const config = db.select().from(boardConfigs).where(eq(boardConfigs.id, id)).get();
    return c.json(config, 201);
  });

  // Get board config
  app.get('/:id', (c) => {
    const config = db.select().from(boardConfigs).where(eq(boardConfigs.id, c.req.param('id'))).get();
    if (!config) return c.json({ error: { message: 'Board config not found', code: 'NOT_FOUND' } }, 404);
    return c.json(config);
  });

  // Update board config
  app.patch('/:id', zValidator('json', updateBoardSchema), async (c) => {
    const id = c.req.param('id');
    const existing = db.select().from(boardConfigs).where(eq(boardConfigs.id, id)).get();
    if (!existing) return c.json({ error: { message: 'Board config not found', code: 'NOT_FOUND' } }, 404);

    const input = c.req.valid('json');
    db.update(boardConfigs).set(input).where(eq(boardConfigs.id, id)).run();
    const updated = db.select().from(boardConfigs).where(eq(boardConfigs.id, id)).get();
    return c.json(updated);
  });

  // Delete board config
  app.delete('/:id', (c) => {
    const existing = db.select().from(boardConfigs).where(eq(boardConfigs.id, c.req.param('id'))).get();
    if (!existing) return c.json({ error: { message: 'Board config not found', code: 'NOT_FOUND' } }, 404);
    db.delete(boardConfigs).where(eq(boardConfigs.id, c.req.param('id'))).run();
    return c.body(null, 204);
  });

  // Trigger manual board sync
  app.post('/:id/sync', (c) => {
    const config = db.select().from(boardConfigs).where(eq(boardConfigs.id, c.req.param('id'))).get();
    if (!config) return c.json({ error: { message: 'Board config not found', code: 'NOT_FOUND' } }, 404);
    return c.json({ status: 'sync_triggered', boardConfigId: c.req.param('id'), timestamp: new Date().toISOString() });
  });

  return app;
}
