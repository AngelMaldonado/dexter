import type { DexterEvent, DexterEventType } from '../types/events.js';

type EventHandler<T extends DexterEvent> = (event: T) => void;

type ExtractEvent<T extends DexterEventType> = Extract<DexterEvent, { type: T }>;

export interface EventBus {
  emit(event: DexterEvent): void;
  on<T extends DexterEventType>(type: T, handler: EventHandler<ExtractEvent<T>>): () => void;
  off<T extends DexterEventType>(type: T, handler: EventHandler<ExtractEvent<T>>): void;
}
