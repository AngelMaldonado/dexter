import { EventEmitter } from 'events';
import type { EventBus as IEventBus, DexterEvent, DexterEventType } from '@dexter/core';

export class EventBus implements IEventBus {
  private emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(100);
  }

  emit(event: DexterEvent): void {
    this.emitter.emit(event.type, event);
    this.emitter.emit('*', event); // wildcard for subscribers that want all events
  }

  on<T extends DexterEventType>(
    type: T,
    handler: (event: Extract<DexterEvent, { type: T }>) => void,
  ): () => void {
    this.emitter.on(type, handler);
    return () => this.emitter.off(type, handler);
  }

  off<T extends DexterEventType>(
    type: T,
    handler: (event: Extract<DexterEvent, { type: T }>) => void,
  ): void {
    this.emitter.off(type, handler);
  }

  onAny(handler: (event: DexterEvent) => void): () => void {
    this.emitter.on('*', handler);
    return () => this.emitter.off('*', handler);
  }
}
