import type { DexterEventType } from '../types.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventHandler = (data: any) => void;

const SSE_URL = '/api/v1/events/stream';

const EVENT_TYPES: DexterEventType[] = [
  'entity:created',
  'entity:state-changed',
  'entity:energy-updated',
  'task:created',
  'task:assigned',
  'task:started',
  'task:completed',
  'task:failed',
  'achievement:unlocked',
  'xp:awarded',
  'message:sent',
  'board:synced',
  'memory:stored',
];

export class SSEClient {
  private eventSource: EventSource | null = null;
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private _connected = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private url: string = SSE_URL;
  private shouldReconnect = false;

  get connected() {
    return this._connected;
  }

  connect(url: string = SSE_URL) {
    this.url = url;
    this.shouldReconnect = true;
    this.reconnectDelay = 1000;
    this.doConnect();
  }

  private doConnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    const es = new EventSource(this.url);
    this.eventSource = es;

    es.onopen = () => {
      this._connected = true;
      this.reconnectDelay = 1000;
      this.handlers.get('__connected')?.forEach((h) => h(true));
    };

    for (const type of EVENT_TYPES) {
      es.addEventListener(type, (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          this.handlers.get(type)?.forEach((handler) => handler(data));
          this.handlers.get('*')?.forEach((handler) => handler({ type, ...data }));
        } catch {
          // ignore parse errors
        }
      });
    }

    es.onmessage = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type) {
          this.handlers.get(data.type)?.forEach((handler) => handler(data));
          this.handlers.get('*')?.forEach((handler) => handler(data));
        }
      } catch {
        // ignore
      }
    };

    es.onerror = () => {
      this._connected = false;
      this.handlers.get('__connected')?.forEach((h) => h(false));
      // Close to stop browser auto-reconnect
      es.close();
      this.eventSource = null;
      // Manual reconnect with exponential backoff
      if (this.shouldReconnect) {
        this.reconnectTimer = setTimeout(() => {
          this.doConnect();
        }, this.reconnectDelay);
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
      }
    };
  }

  on(type: string, handler: EventHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
    return () => this.off(type, handler);
  }

  off(type: string, handler: EventHandler) {
    this.handlers.get(type)?.delete(handler);
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.eventSource?.close();
    this.eventSource = null;
    this._connected = false;
  }
}

export const sseClient = new SSEClient();
