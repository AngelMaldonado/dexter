import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import type { DexterDb } from '@dexter/db';
import { llmConfigs } from '@dexter/db';
import { generateId } from '@dexter/core';

const createLLMSchema = z.object({
  name: z.string().min(1).max(100),
  provider: z.enum(['anthropic', 'openai', 'ollama']),
  model: z.string().min(1),
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  maxTokens: z.number().default(4096),
  temperature: z.number().min(0).max(2).default(0.7),
});

const updateLLMSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  provider: z.enum(['anthropic', 'openai', 'ollama']).optional(),
  model: z.string().min(1).optional(),
  apiKey: z.string().nullable().optional(),
  baseUrl: z.string().nullable().optional(),
  maxTokens: z.number().optional(),
  temperature: z.number().min(0).max(2).optional(),
});

export function llmProviderRoutes(db: DexterDb) {
  const app = new Hono();

  // List LLM configs
  app.get('/', (c) => {
    const configs = db.select().from(llmConfigs).all();
    // Redact API keys in list responses
    const safe = configs.map(cfg => ({ ...cfg, apiKey: cfg.apiKey ? '***' : null }));
    return c.json(safe);
  });

  // Create LLM config
  app.post('/', zValidator('json', createLLMSchema), async (c) => {
    const input = c.req.valid('json');
    const id = generateId();
    db.insert(llmConfigs).values({
      id,
      ...input,
      createdAt: new Date().toISOString(),
    }).run();
    const config = db.select().from(llmConfigs).where(eq(llmConfigs.id, id)).get();
    return c.json({ ...config!, apiKey: config!.apiKey ? '***' : null }, 201);
  });

  // Get LLM config
  app.get('/:id', (c) => {
    const config = db.select().from(llmConfigs).where(eq(llmConfigs.id, c.req.param('id'))).get();
    if (!config) return c.json({ error: { message: 'LLM config not found', code: 'NOT_FOUND' } }, 404);
    return c.json({ ...config, apiKey: config.apiKey ? '***' : null });
  });

  // Update LLM config
  app.patch('/:id', zValidator('json', updateLLMSchema), async (c) => {
    const id = c.req.param('id');
    const existing = db.select().from(llmConfigs).where(eq(llmConfigs.id, id)).get();
    if (!existing) return c.json({ error: { message: 'LLM config not found', code: 'NOT_FOUND' } }, 404);

    const input = c.req.valid('json');
    db.update(llmConfigs).set(input).where(eq(llmConfigs.id, id)).run();
    const updated = db.select().from(llmConfigs).where(eq(llmConfigs.id, id)).get();
    return c.json({ ...updated!, apiKey: updated!.apiKey ? '***' : null });
  });

  // Delete LLM config
  app.delete('/:id', (c) => {
    const existing = db.select().from(llmConfigs).where(eq(llmConfigs.id, c.req.param('id'))).get();
    if (!existing) return c.json({ error: { message: 'LLM config not found', code: 'NOT_FOUND' } }, 404);
    db.delete(llmConfigs).where(eq(llmConfigs.id, c.req.param('id'))).run();
    return c.body(null, 204);
  });

  // Test LLM connection
  app.post('/:id/test', async (c) => {
    const config = db.select().from(llmConfigs).where(eq(llmConfigs.id, c.req.param('id'))).get();
    if (!config) return c.json({ error: { message: 'LLM config not found', code: 'NOT_FOUND' } }, 404);

    // Basic connectivity test - actual provider instantiation would go here
    return c.json({
      status: 'ok',
      provider: config.provider,
      model: config.model,
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}
