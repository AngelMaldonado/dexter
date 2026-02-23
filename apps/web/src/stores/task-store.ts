import { create } from 'zustand';
import { api } from '../api/client.js';
import type { Task, CreateTaskInput, UpdateTaskInput, TaskStatus, DexterEvent } from '../types.js';

interface TaskStore {
  tasks: Task[];
  selectedTaskId: string | null;
  loading: boolean;
  error: string | null;

  fetchTasks: () => Promise<void>;
  selectTask: (id: string | null) => void;
  createTask: (input: CreateTaskInput) => Promise<Task>;
  updateTask: (id: string, updates: UpdateTaskInput) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  assignTask: (id: string, entityId?: string) => Promise<void>;
  handleTaskEvent: (event: DexterEvent) => void;
  getTasksByStatus: (status: TaskStatus) => Task[];
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  selectedTaskId: null,
  loading: false,
  error: null,

  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const tasks = await api.tasks.list();
      set({ tasks, loading: false });
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : 'Failed to fetch tasks' });
    }
  },

  selectTask: (id) => set({ selectedTaskId: id }),

  createTask: async (input) => {
    const task = await api.tasks.create(input);
    set((s) => ({ tasks: [...s.tasks, task] }));
    return task;
  },

  updateTask: async (id, updates) => {
    const updated = await api.tasks.update(id, updates);
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? updated : t)),
    }));
  },

  deleteTask: async (id) => {
    await api.tasks.delete(id);
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== id),
      selectedTaskId: s.selectedTaskId === id ? null : s.selectedTaskId,
    }));
  },

  assignTask: async (id, entityId?) => {
    await api.tasks.assign(id, entityId);
    await get().fetchTasks();
  },

  handleTaskEvent: (event) => {
    switch (event.type) {
      case 'task:created':
        set((s) => {
          if (s.tasks.some((t) => t.id === event.payload.task.id)) return s;
          return { tasks: [...s.tasks, event.payload.task] };
        });
        break;
      case 'task:assigned':
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === event.payload.taskId
              ? { ...t, assignedEntityId: event.payload.entityId, status: 'todo' as TaskStatus }
              : t,
          ),
        }));
        break;
      case 'task:started':
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === event.payload.taskId
              ? { ...t, status: 'in_progress' as TaskStatus }
              : t,
          ),
        }));
        break;
      case 'task:completed':
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === event.payload.taskId
              ? {
                  ...t,
                  status: 'done' as TaskStatus,
                  actualTokensUsed: event.payload.tokensUsed,
                  actualCost: event.payload.cost,
                }
              : t,
          ),
        }));
        break;
      case 'task:failed':
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === event.payload.taskId
              ? { ...t, status: 'failed' as TaskStatus }
              : t,
          ),
        }));
        break;
    }
  },

  getTasksByStatus: (status) => get().tasks.filter((t) => t.status === status),
}));
