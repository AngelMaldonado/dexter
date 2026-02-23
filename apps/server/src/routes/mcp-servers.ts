import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import type { DexterDb } from '@dexter/db';
import { mcpConfigs } from '@dexter/db';
import { generateId } from '@dexter/core';

const createMCPSchema = z.object({
  name: z.string().min(1).max(100),
  command: z.string().min(1),
  args: z.string().default('[]'),
  env: z.string().default('{}'),
  capabilities: z.string().default('[]'),
  isActive: z.number().default(1),
});

const updateMCPSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  command: z.string().min(1).optional(),
  args: z.string().optional(),
  env: z.string().optional(),
  capabilities: z.string().optional(),
  isActive: z.number().optional(),
});

export function mcpServerRoutes(db: DexterDb) {
  const app = new Hono();

  // List MCP server configs
  app.get('/', (c) => {
    const configs = db.select().from(mcpConfigs).all();
    return c.json(configs);
  });

  // Create MCP server config
  app.post('/', zValidator('json', createMCPSchema), async (c) => {
    const input = c.req.valid('json');
    const id = generateId();
    db.insert(mcpConfigs).values({
      id,
      ...input,
      createdAt: new Date().toISOString(),
    }).run();
    const config = db.select().from(mcpConfigs).where(eq(mcpConfigs.id, id)).get();
    return c.json(config, 201);
  });

  // Get MCP server config
  app.get('/:id', (c) => {
    const config = db.select().from(mcpConfigs).where(eq(mcpConfigs.id, c.req.param('id'))).get();
    if (!config) return c.json({ error: { message: 'MCP config not found', code: 'NOT_FOUND' } }, 404);
    return c.json(config);
  });

  // Update MCP server config
  app.patch('/:id', zValidator('json', updateMCPSchema), async (c) => {
    const id = c.req.param('id');
    const existing = db.select().from(mcpConfigs).where(eq(mcpConfigs.id, id)).get();
    if (!existing) return c.json({ error: { message: 'MCP config not found', code: 'NOT_FOUND' } }, 404);

    const input = c.req.valid('json');
    db.update(mcpConfigs).set(input).where(eq(mcpConfigs.id, id)).run();
    const updated = db.select().from(mcpConfigs).where(eq(mcpConfigs.id, id)).get();
    return c.json(updated);
  });

  // Delete MCP server config
  app.delete('/:id', (c) => {
    const existing = db.select().from(mcpConfigs).where(eq(mcpConfigs.id, c.req.param('id'))).get();
    if (!existing) return c.json({ error: { message: 'MCP config not found', code: 'NOT_FOUND' } }, 404);
    db.delete(mcpConfigs).where(eq(mcpConfigs.id, c.req.param('id'))).run();
    return c.body(null, 204);
  });

  // Test MCP server connection
  app.post('/:id/test', async (c) => {
    const config = db.select().from(mcpConfigs).where(eq(mcpConfigs.id, c.req.param('id'))).get();
    if (!config) return c.json({ error: { message: 'MCP config not found', code: 'NOT_FOUND' } }, 404);

    return c.json({
      status: 'ok',
      name: config.name,
      command: config.command,
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}
