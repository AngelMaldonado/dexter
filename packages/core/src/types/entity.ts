export type EntityState = 'idle' | 'working' | 'thinking' | 'blocked' | 'collaborating' | 'break';

export type Mood = 'happy' | 'neutral' | 'frustrated' | 'tired' | 'excited';

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
  state: EntityState;
  mood: Mood;
  energy: number; // 0-100
  avatarUrl: string | null;
  llmConfigId: string | null;
  soulPath: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEntityInput {
  name: string;
  role: string;
  departmentId?: string;
  skills: string[];
  personality: string[];
  communication: string;
  rules: string[];
  backstory: string;
  avatarUrl?: string;
  llmConfigId?: string;
  soulPath: string;
}

export interface UpdateEntityInput {
  name?: string;
  role?: string;
  departmentId?: string | null;
  skills?: string[];
  personality?: string[];
  communication?: string;
  rules?: string[];
  backstory?: string;
  state?: EntityState;
  mood?: Mood;
  energy?: number;
  avatarUrl?: string | null;
  llmConfigId?: string | null;
}
