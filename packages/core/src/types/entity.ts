export type EntityState = 'idle' | 'working' | 'thinking' | 'blocked' | 'on_break' | 'collaborating';

export type HierarchyRole = 'worker' | 'lead' | 'manager';

export type BehaviorMode = 'autonomous' | 'supervised' | 'plan_only' | 'review_only';

export type Mood = 'happy' | 'neutral' | 'frustrated' | 'tired' | 'excited';

export interface ParsedSoul {
  name: string;
  role: string;
  hierarchy: HierarchyRole;
  skills: string[];
  personality: string[];
  communication: string;
  mcpServers?: Record<string, Record<string, unknown>>;
  rules: string;
  background: string;
  rawMarkdown: string;
}

export interface Entity {
  id: string;
  name: string;
  soulMd: string;
  parsedSoul: ParsedSoul;
  departmentId: string | null;
  hierarchyRole: HierarchyRole;
  behaviorMode: BehaviorMode;
  state: EntityState;
  energy: number;
  mood: Mood;
  xp: number;
  level: number;
  deskX: number | null;
  deskY: number | null;
  llmConfigId: string | null;
  maxConcurrentTasks: number;
  energyDrainRate: number;
  energyRecoveryRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEntityInput {
  name: string;
  soulMd: string;
  departmentId?: string;
  llmConfigId?: string;
  hierarchyRole?: HierarchyRole;
  behaviorMode?: BehaviorMode;
  deskX?: number;
  deskY?: number;
}

export interface UpdateEntityInput {
  name?: string;
  soulMd?: string;
  departmentId?: string | null;
  hierarchyRole?: HierarchyRole;
  behaviorMode?: BehaviorMode;
  state?: EntityState;
  energy?: number;
  mood?: Mood;
  xp?: number;
  level?: number;
  deskX?: number | null;
  deskY?: number | null;
  llmConfigId?: string | null;
  maxConcurrentTasks?: number;
  energyDrainRate?: number;
  energyRecoveryRate?: number;
}
