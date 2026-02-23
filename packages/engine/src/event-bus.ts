import { EventEmitter } from 'events';
import type { IEventBus, DexterEvent, DexterEventType } from '@dexter/core';

export class EventBus implements IEventBus {
  private emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(100);
  }

  emit(event: DexterEvent): void {
    this.emitter.emit(event.type, event);
    this.emitter.emit('*', event);
  }

  on(type: DexterEventType, handler: (event: DexterEvent) => void): void {
    this.emitter.on(type, handler);
  }

  off(type: DexterEventType, handler: (event: DexterEvent) => void): void {
    this.emitter.off(type, handler);
  }

  onAny(handler: (event: DexterEvent) => void): void {
    this.emitter.on('*', handler);
  }

  offAny(handler: (event: DexterEvent) => void): void {
    this.emitter.off('*', handler);
  }
}
