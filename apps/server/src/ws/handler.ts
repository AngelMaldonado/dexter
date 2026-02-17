import type { ServerWebSocket } from 'bun';
import type { EventBus } from '@dexter/engine';
import type { DexterEvent } from '@dexter/core';

const clients = new Set<ServerWebSocket<unknown>>();

export function setupWebSocket(eventBus: EventBus) {
  // Subscribe to all events and broadcast to connected clients
  eventBus.onAny((event: DexterEvent) => {
    const message = JSON.stringify(event);
    for (const ws of clients) {
      try {
        ws.send(message);
      } catch {
        clients.delete(ws);
      }
    }
  });
}

export function handleWsOpen(ws: ServerWebSocket<unknown>) {
  clients.add(ws);
}

export function handleWsClose(ws: ServerWebSocket<unknown>) {
  clients.delete(ws);
}

export function handleWsMessage(_ws: ServerWebSocket<unknown>, _message: string | Buffer) {
  // Future: handle client-to-server messages (e.g., subscribe to specific events)
}
