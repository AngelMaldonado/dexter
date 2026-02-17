import { create } from 'zustand';
import { api } from '../lib/api.js';
import type { Entity, Task, Department, ActivityEntry, OfficeState } from '../lib/api.js';

interface AppState {
  // Entities
  entities: Entity[];
  loadingEntities: boolean;
  fetchEntities: () => Promise<void>;

  // Tasks
  tasks: Task[];
  loadingTasks: boolean;
  fetchTasks: () => Promise<void>;

  // Departments
  departments: Department[];
  fetchDepartments: () => Promise<void>;

  // Activity
  activity: ActivityEntry[];
  fetchActivity: () => Promise<void>;

  // Office
  officeState: OfficeState | null;
  fetchOfficeState: () => Promise<void>;

  // Real-time updates
  handleEvent: (event: Record<string, unknown>) => void;
}

export const useStore = create<AppState>((set, get) => ({
  entities: [],
  loadingEntities: false,
  fetchEntities: async () => {
    set({ loadingEntities: true });
    try {
      const entities = await api.getEntities();
      set({ entities, loadingEntities: false });
    } catch {
      set({ loadingEntities: false });
    }
  },

  tasks: [],
  loadingTasks: false,
  fetchTasks: async () => {
    set({ loadingTasks: true });
    try {
      const tasks = await api.getTasks();
      set({ tasks, loadingTasks: false });
    } catch {
      set({ loadingTasks: false });
    }
  },

  departments: [],
  fetchDepartments: async () => {
    try {
      const departments = await api.getDepartments();
      set({ departments });
    } catch {
      // ignore
    }
  },

  activity: [],
  fetchActivity: async () => {
    try {
      const activity = await api.getActivity(30);
      set({ activity });
    } catch {
      // ignore
    }
  },

  officeState: null,
  fetchOfficeState: async () => {
    try {
      const officeState = await api.getOfficeState();
      set({ officeState });
    } catch {
      // ignore
    }
  },

  handleEvent: (event) => {
    const type = event.type as string;
    // Re-fetch relevant data on events
    if (type.startsWith('entity:')) {
      get().fetchEntities();
      get().fetchOfficeState();
    }
    if (type.startsWith('task:')) {
      get().fetchTasks();
    }
    get().fetchActivity();
  },
}));
