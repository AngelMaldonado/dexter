import type { DexterEvent } from '../types/events.js';

export interface IEventBus {
  emit(event: DexterEvent): void;
  on(type: DexterEvent['type'], handler: (event: DexterEvent) => void): void;
  off(type: DexterEvent['type'], handler: (event: DexterEvent) => void): void;
  onAny(handler: (event: DexterEvent) => void): void;
  offAny(handler: (event: DexterEvent) => void): void;
}
