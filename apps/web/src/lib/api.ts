const BASE_URL = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || res.statusText);
  }
  return res.json();
}

export const api = {
  // Entities
  getEntities: () => request<Entity[]>('/entities'),
  getEntity: (id: string) => request<Entity>(`/entities/${id}`),
  createEntity: (data: CreateEntityInput) =>
    request<Entity>('/entities', { method: 'POST', body: JSON.stringify(data) }),
  createEntityFromSoul: (soulPath: string, llmConfigId?: string, departmentId?: string) =>
    request<Entity>('/entities/from-soul', {
      method: 'POST',
      body: JSON.stringify({ soulPath, llmConfigId, departmentId }),
    }),
  updateEntity: (id: string, data: Partial<Entity>) =>
    request<Entity>(`/entities/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteEntity: (id: string) =>
    request<{ ok: boolean }>(`/entities/${id}`, { method: 'DELETE' }),

  // Tasks
  getTasks: (status?: string) =>
    request<Task[]>(`/tasks${status ? `?status=${status}` : ''}`),
  getTask: (id: string) => request<Task>(`/tasks/${id}`),
  createTask: (data: CreateTaskInput) =>
    request<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id: string, data: Partial<Task>) =>
    request<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTask: (id: string) =>
    request<{ ok: boolean }>(`/tasks/${id}`, { method: 'DELETE' }),
  assignTask: (id: string, entityId?: string) =>
    request<{ result: string }>(`/tasks/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ entityId }),
    }),

  // Organization
  getDepartments: () => request<Department[]>('/org/departments'),
  createDepartment: (data: CreateDepartmentInput) =>
    request<Department>('/org/departments', { method: 'POST', body: JSON.stringify(data) }),

  // Office
  getOfficeState: () => request<OfficeState>('/office/state'),

  // Activity
  getActivity: (limit?: number) =>
    request<ActivityEntry[]>(`/activity${limit ? `?limit=${limit}` : ''}`),
};

// Types (duplicated from core for the frontend — in a real app you'd share these)
export interface Entity {
  id: string;
  name: string;
  role: string;
  departmentId: string | null;
  skills: string[];
  personality: string[];
  communication: string;
  rules: string[];
  backstory: string;
  state: string;
  mood: string;
  energy: number;
  avatarUrl: string | null;
  llmConfigId: string | null;
  soulPath: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEntityInput {
  name: string;
  role: string;
  skills: string[];
  personality: string[];
  communication: string;
  rules: string[];
  backstory: string;
  soulPath: string;
  departmentId?: string;
  llmConfigId?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  skills: string[];
  assigneeId: string | null;
  departmentId: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  priority?: string;
  skills?: string[];
  assigneeId?: string;
  departmentId?: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentInput {
  name: string;
  description: string;
  color?: string;
}

export interface OfficeState {
  departments: (Department & { entities: Entity[] })[];
  unassigned: Entity[];
}

export interface ActivityEntry {
  id: string;
  entityId: string | null;
  type: string;
  message: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}
