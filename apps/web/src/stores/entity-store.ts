import { create } from 'zustand';
import { api } from '../api/client.js';
import type { Entity, CreateEntityInput, UpdateEntityInput, DexterEvent } from '../types.js';

interface EntityStore {
  entities: Entity[];
  selectedEntityId: string | null;
  loading: boolean;
  error: string | null;

  fetchEntities: () => Promise<void>;
  selectEntity: (id: string | null) => void;
  createEntity: (input: CreateEntityInput) => Promise<Entity>;
  updateEntity: (id: string, updates: UpdateEntityInput) => Promise<void>;
  deleteEntity: (id: string) => Promise<void>;
  triggerAction: (id: string, action: string) => Promise<void>;
  handleEntityEvent: (event: DexterEvent) => void;
}

export const useEntityStore = create<EntityStore>((set, get) => ({
  entities: [],
  selectedEntityId: null,
  loading: false,
  error: null,

  fetchEntities: async () => {
    set({ loading: true, error: null });
    try {
      const entities = await api.entities.list();
      set({ entities, loading: false });
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : 'Failed to fetch entities' });
    }
  },

  selectEntity: (id) => set({ selectedEntityId: id }),

  createEntity: async (input) => {
    const entity = await api.entities.create(input);
    set((s) => ({ entities: [...s.entities, entity] }));
    return entity;
  },

  updateEntity: async (id, updates) => {
    const updated = await api.entities.update(id, updates);
    set((s) => ({
      entities: s.entities.map((e) => (e.id === id ? updated : e)),
    }));
  },

  deleteEntity: async (id) => {
    await api.entities.delete(id);
    set((s) => ({
      entities: s.entities.filter((e) => e.id !== id),
      selectedEntityId: s.selectedEntityId === id ? null : s.selectedEntityId,
    }));
  },

  triggerAction: async (id, action) => {
    const updated = await api.entities.action(id, action);
    set((s) => ({
      entities: s.entities.map((e) => (e.id === id ? updated : e)),
    }));
  },

  handleEntityEvent: (event) => {
    switch (event.type) {
      case 'entity:created':
        set((s) => {
          if (s.entities.some((e) => e.id === event.payload.entity.id)) return s;
          return { entities: [...s.entities, event.payload.entity] };
        });
        break;
      case 'entity:state-changed':
        set((s) => ({
          entities: s.entities.map((e) =>
            e.id === event.payload.entityId
              ? { ...e, state: event.payload.newState }
              : e,
          ),
        }));
        break;
      case 'entity:energy-updated':
        set((s) => ({
          entities: s.entities.map((e) =>
            e.id === event.payload.entityId
              ? { ...e, energy: event.payload.newEnergy, mood: event.payload.mood }
              : e,
          ),
        }));
        break;
    }
  },
}));
