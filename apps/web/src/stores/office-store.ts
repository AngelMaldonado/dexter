import { create } from 'zustand';
import { api } from '../api/client.js';
import type { OfficeLayout, Department } from '../types.js';

interface Viewport {
  x: number;
  y: number;
  scale: number;
}

interface OfficeStore {
  layout: OfficeLayout | null;
  departments: Department[];
  viewport: Viewport;
  hoveredEntityId: string | null;
  loading: boolean;

  fetchLayout: () => Promise<void>;
  fetchDepartments: () => Promise<void>;
  setViewport: (viewport: Partial<Viewport>) => void;
  setHoveredEntity: (id: string | null) => void;
  zoom: (delta: number) => void;
  pan: (dx: number, dy: number) => void;
  resetView: () => void;
}

const DEFAULT_VIEWPORT: Viewport = { x: 400, y: 100, scale: 1 };

export const useOfficeStore = create<OfficeStore>((set, get) => ({
  layout: null,
  departments: [],
  viewport: { ...DEFAULT_VIEWPORT },
  hoveredEntityId: null,
  loading: false,

  fetchLayout: async () => {
    set({ loading: true });
    try {
      const layout = await api.office.layout();
      set({ layout, loading: false });
    } catch {
      set({
        layout: {
          width: 20,
          height: 16,
          departments: [],
          desks: [],
          meetingRooms: [],
        },
        loading: false,
      });
    }
  },

  fetchDepartments: async () => {
    try {
      const departments = await api.departments.list();
      set({ departments });
    } catch {
      // ignore
    }
  },

  setViewport: (partial) =>
    set((s) => ({ viewport: { ...s.viewport, ...partial } })),

  setHoveredEntity: (id) => set({ hoveredEntityId: id }),

  zoom: (delta) =>
    set((s) => ({
      viewport: {
        ...s.viewport,
        scale: Math.max(0.3, Math.min(3, s.viewport.scale + delta)),
      },
    })),

  pan: (dx, dy) =>
    set((s) => ({
      viewport: {
        ...s.viewport,
        x: s.viewport.x + dx,
        y: s.viewport.y + dy,
      },
    })),

  resetView: () => set({ viewport: { ...DEFAULT_VIEWPORT } }),
}));
