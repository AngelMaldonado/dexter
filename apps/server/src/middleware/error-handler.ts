import type { Context, Next } from 'hono';

export async function errorHandler(c: Context, next: Next) {
  try {
    await next();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = (err as any)?.status ?? 500;
    console.error(`[error] ${c.req.method} ${c.req.path}:`, message);
    return c.json({ error: { message, code: status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR' } }, status);
  }
}
