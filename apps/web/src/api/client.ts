import type {
  Entity, CreateEntityInput, UpdateEntityInput,
  Task, CreateTaskInput, UpdateTaskInput,
  Department, OrgConfig,
  AchievementDefinition, EntityAchievement, Streak, LeaderboardEntry,
  OfficeLayout,
  LLMConfig, MCPServerConfig, BoardProviderConfig,
  ActivityEntry, OrchestratorStatus,
} from '../types.js';

const API_BASE = '/api/v1';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body.error || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

function params(filters?: Record<string, string | number | boolean | undefined>): string {
  if (!filters) return '';
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined) p.set(k, String(v));
  }
  const str = p.toString();
  return str ? `?${str}` : '';
}

export const api = {
  entities: {
    list: (filters?: Record<string, string>) =>
      request<Entity[]>(`/entities${params(filters)}`),
    get: (id: string) =>
      request<Entity>(`/entities/${id}`),
    create: (input: CreateEntityInput) =>
      request<Entity>('/entities', { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, updates: UpdateEntityInput) =>
      request<Entity>(`/entities/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
    delete: (id: string) =>
      request<void>(`/entities/${id}`, { method: 'DELETE' }),
    action: (id: string, action: string) =>
      request<Entity>(`/entities/${id}/action`, { method: 'POST', body: JSON.stringify({ action }), headers: { 'Content-Type': 'application/json' } }),
    stats: (id: string) =>
      request<Record<string, unknown>>(`/entities/${id}/stats`),
    memories: (id: string) =>
      request<Array<Record<string, unknown>>>(`/entities/${id}/memories`),
    messages: (id: string) =>
      request<Array<Record<string, unknown>>>(`/entities/${id}/messages`),
  },

  tasks: {
    list: (filters?: Record<string, string>) =>
      request<Task[]>(`/tasks${params(filters)}`),
    get: (id: string) =>
      request<Task>(`/tasks/${id}`),
    create: (input: CreateTaskInput) =>
      request<Task>('/tasks', { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, updates: UpdateTaskInput) =>
      request<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
    delete: (id: string) =>
      request<void>(`/tasks/${id}`, { method: 'DELETE' }),
    assign: (id: string, entityId?: string) =>
      request<{ result: string }>(`/tasks/${id}/assign`, {
        method: 'POST',
        body: JSON.stringify({ entityId }),
      }),
    runs: (id: string) =>
      request<Array<Record<string, unknown>>>(`/tasks/${id}/runs`),
  },

  departments: {
    list: () => request<Department[]>('/departments'),
    get: (id: string) => request<Department>(`/departments/${id}`),
    create: (input: { name: string; description: string; color?: string }) =>
      request<Department>('/departments', { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, updates: Partial<Department>) =>
      request<Department>(`/departments/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
    delete: (id: string) =>
      request<void>(`/departments/${id}`, { method: 'DELETE' }),
    entities: (id: string) =>
      request<Entity[]>(`/departments/${id}/entities`),
    stats: (id: string) =>
      request<Record<string, unknown>>(`/departments/${id}/stats`),
  },

  office: {
    layout: () => request<OfficeLayout>('/office/layout'),
    updateLayout: (updates: Partial<OfficeLayout>) =>
      request<OfficeLayout>('/office/layout', { method: 'PATCH', body: JSON.stringify(updates) }),
    state: () => request<{ entities: Entity[]; departments: Department[] }>('/office/state'),
  },

  achievements: {
    list: () => request<AchievementDefinition[]>('/achievements'),
    leaderboard: (filters?: Record<string, string>) =>
      request<LeaderboardEntry[]>(`/achievements/leaderboard${params(filters)}`),
    streaks: () => request<Streak[]>('/achievements/streaks'),
    entityAchievements: (entityId: string) =>
      request<EntityAchievement[]>(`/achievements/entity/${entityId}`),
  },

  activity: {
    recent: (limit = 50) =>
      request<ActivityEntry[]>(`/activity?limit=${limit}`),
    byEntity: (entityId: string) =>
      request<ActivityEntry[]>(`/activity/entity/${entityId}`),
  },

  orchestrator: {
    status: () => request<OrchestratorStatus>('/orchestrator/status'),
    start: () => request<void>('/orchestrator/start', { method: 'POST' }),
    pause: () => request<void>('/orchestrator/pause', { method: 'POST' }),
    resume: () => request<void>('/orchestrator/resume', { method: 'POST' }),
  },

  providers: {
    llm: {
      list: () => request<LLMConfig[]>('/llm-providers'),
      get: (id: string) => request<LLMConfig>(`/llm-providers/${id}`),
      create: (input: Omit<LLMConfig, 'id' | 'createdAt'>) =>
        request<LLMConfig>('/llm-providers', { method: 'POST', body: JSON.stringify(input) }),
      update: (id: string, updates: Partial<LLMConfig>) =>
        request<LLMConfig>(`/llm-providers/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
      delete: (id: string) =>
        request<void>(`/llm-providers/${id}`, { method: 'DELETE' }),
      test: (id: string) =>
        request<{ success: boolean; message: string }>(`/llm-providers/${id}/test`, { method: 'POST' }),
    },
    mcp: {
      list: () => request<MCPServerConfig[]>('/mcp-servers'),
      get: (id: string) => request<MCPServerConfig>(`/mcp-servers/${id}`),
      create: (input: Omit<MCPServerConfig, 'id' | 'createdAt'>) =>
        request<MCPServerConfig>('/mcp-servers', { method: 'POST', body: JSON.stringify(input) }),
      update: (id: string, updates: Partial<MCPServerConfig>) =>
        request<MCPServerConfig>(`/mcp-servers/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
      delete: (id: string) =>
        request<void>(`/mcp-servers/${id}`, { method: 'DELETE' }),
      test: (id: string) =>
        request<{ success: boolean; message: string }>(`/mcp-servers/${id}/test`, { method: 'POST' }),
    },
    boards: {
      list: () => request<BoardProviderConfig[]>('/boards'),
      get: (id: string) => request<BoardProviderConfig>(`/boards/${id}`),
      create: (input: Omit<BoardProviderConfig, 'id' | 'createdAt'>) =>
        request<BoardProviderConfig>('/boards', { method: 'POST', body: JSON.stringify(input) }),
      update: (id: string, updates: Partial<BoardProviderConfig>) =>
        request<BoardProviderConfig>(`/boards/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
      delete: (id: string) =>
        request<void>(`/boards/${id}`, { method: 'DELETE' }),
      sync: (id: string) =>
        request<{ cardsCreated: number; cardsUpdated: number }>(`/boards/${id}/sync`, { method: 'POST' }),
    },
  },

  org: {
    get: () => request<OrgConfig>('/org'),
    update: (updates: Partial<OrgConfig>) =>
      request<OrgConfig>('/org', { method: 'PATCH', body: JSON.stringify(updates) }),
  },
};
