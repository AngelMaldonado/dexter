import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import type { EventBus } from '@dexter/engine';
import type { DexterEvent } from '@dexter/core';

export function createEventRoutes(eventBus: EventBus) {
  const app = new Hono();

  app.get('/stream', async (c) => {
    return streamSSE(c, async (stream) => {
      const handler = (event: DexterEvent) => {
        stream.writeSSE({
          event: event.type,
          data: JSON.stringify(event),
          id: String(Date.now()),
        }).catch(() => {});
      };

      eventBus.onAny(handler);

      // Send initial connection confirmation
      await stream.writeSSE({ event: 'connected', data: JSON.stringify({ timestamp: new Date().toISOString() }), id: '0' });

      // Keepalive ping every 5 seconds (must be well under Bun's idleTimeout)
      const keepAlive = setInterval(() => {
        stream.writeSSE({ event: 'ping', data: '', id: String(Date.now()) }).catch(() => {});
      }, 5000);

      stream.onAbort(() => {
        clearInterval(keepAlive);
        eventBus.offAny(handler);
      });

      // Block until client disconnects
      await new Promise(() => {});
    });
  });

  return app;
}
