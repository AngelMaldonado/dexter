// Entity types
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

// Task types
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | 'failed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  requiredSkills: string[];
  assignedEntityId: string | null;
  parentTaskId: string | null;
  departmentId: string | null;
  boardCardId: string | null;
  boardProviderId: string | null;
  estimatedEffort: number;
  actualTokensUsed: number;
  actualCost: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  priority?: TaskPriority;
  requiredSkills?: string[];
  assignedEntityId?: string;
  parentTaskId?: string;
  departmentId?: string;
  estimatedEffort?: number;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  requiredSkills?: string[];
  assignedEntityId?: string | null;
  parentTaskId?: string | null;
  departmentId?: string | null;
  estimatedEffort?: number;
  actualTokensUsed?: number;
  actualCost?: number;
  completedAt?: string | null;
}

// Organization
export interface Department {
  id: string;
  name: string;
  description: string;
  color: string;
  floorZoneX: number;
  floorZoneY: number;
  floorZoneWidth: number;
  floorZoneHeight: number;
  createdAt: string;
}

export interface OrgConfig {
  id: string;
  name: string;
  conventions: string;
  updatedAt: string;
}

// Gamification
export type AchievementCategory = 'milestone' | 'streak' | 'performance' | 'social';

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  criteria: Record<string, unknown>;
  xpReward: number;
}

export interface EntityAchievement {
  entityId: string;
  achievementId: string;
  unlockedAt: string;
}

export interface XPEvent {
  id: string;
  entityId: string;
  amount: number;
  source: string;
  sourceEventId: string | null;
  createdAt: string;
}

export interface Streak {
  id: string;
  entityId: string;
  type: 'daily' | 'sprint' | 'collaboration';
  currentCount: number;
  longestCount: number;
  lastActivityAt: string;
  isActive: boolean;
  createdAt: string;
}

export interface LeaderboardEntry {
  entityId: string;
  entityName: string;
  departmentId: string | null;
  totalXp: number;
  level: number;
  tasksCompleted: number;
  currentStreak: number;
  rank: number;
}

// Office layout
export interface DeskPosition {
  x: number;
  y: number;
  entityId: string | null;
}

export interface OfficeLayout {
  width: number;
  height: number;
  departments: Array<{
    departmentId: string;
    zone: { x: number; y: number; width: number; height: number };
  }>;
  desks: DeskPosition[];
  meetingRooms: Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    name: string;
  }>;
}

// LLM Config
export type LLMProviderType = 'anthropic' | 'openai' | 'ollama';

export interface LLMConfig {
  id: string;
  name: string;
  provider: LLMProviderType;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  maxTokens: number;
  temperature: number;
  createdAt: string;
}

// MCP Server Config
export interface MCPCapability {
  name: string;
  description: string;
  enabled: boolean;
}

export interface MCPServerConfig {
  id: string;
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  capabilities: MCPCapability[];
  createdAt: string;
}

// Board Provider Config
export interface BoardProviderConfig {
  id: string;
  name: string;
  type: 'trello' | 'linear' | 'github';
  credentials: Record<string, string>;
  boardId: string;
  pollIntervalMs: number;
  statusMapping: Record<string, string>;
  createdAt: string;
}

// Events
export interface EntityCreatedEvent {
  type: 'entity:created';
  timestamp: string;
  payload: { entity: Entity };
}

export interface EntityStateChangedEvent {
  type: 'entity:state-changed';
  timestamp: string;
  payload: { entityId: string; previousState: EntityState; newState: EntityState };
}

export interface EntityEnergyUpdatedEvent {
  type: 'entity:energy-updated';
  timestamp: string;
  payload: { entityId: string; previousEnergy: number; newEnergy: number; mood: Mood };
}

export interface TaskCreatedEvent {
  type: 'task:created';
  timestamp: string;
  payload: { task: Task };
}

export interface TaskAssignedEvent {
  type: 'task:assigned';
  timestamp: string;
  payload: { taskId: string; entityId: string };
}

export interface TaskStartedEvent {
  type: 'task:started';
  timestamp: string;
  payload: { taskId: string; entityId: string };
}

export interface TaskCompletedEvent {
  type: 'task:completed';
  timestamp: string;
  payload: { taskId: string; entityId: string; tokensUsed: number; cost: number };
}

export interface TaskFailedEvent {
  type: 'task:failed';
  timestamp: string;
  payload: { taskId: string; entityId: string; error: string };
}

export interface AchievementUnlockedEvent {
  type: 'achievement:unlocked';
  timestamp: string;
  payload: { entityId: string; achievementId: string; achievementName: string; xpReward: number };
}

export interface XPAwardedEvent {
  type: 'xp:awarded';
  timestamp: string;
  payload: { entityId: string; amount: number; source: string; newTotal: number; newLevel: number };
}

export interface MessageSentEvent {
  type: 'message:sent';
  timestamp: string;
  payload: { fromEntityId: string; toEntityId: string | null; content: string; channel: string };
}

export interface BoardSyncedEvent {
  type: 'board:synced';
  timestamp: string;
  payload: { boardProviderId: string; cardsCreated: number; cardsUpdated: number };
}

export interface MemoryStoredEvent {
  type: 'memory:stored';
  timestamp: string;
  payload: { entityId: string; memoryType: 'episodic' | 'semantic' | 'skill'; taskId: string | null; summary: string };
}

export type DexterEvent =
  | EntityCreatedEvent
  | EntityStateChangedEvent
  | EntityEnergyUpdatedEvent
  | TaskCreatedEvent
  | TaskAssignedEvent
  | TaskStartedEvent
  | TaskCompletedEvent
  | TaskFailedEvent
  | AchievementUnlockedEvent
  | XPAwardedEvent
  | MessageSentEvent
  | BoardSyncedEvent
  | MemoryStoredEvent;

export type DexterEventType = DexterEvent['type'];

// Activity
export interface ActivityEntry {
  id: string;
  entityId: string | null;
  taskId?: string | null;
  eventType: string;
  description: string;
  metadata: string;
  createdAt: string;
  // Legacy aliases
  type?: string;
  message?: string;
}

// Orchestrator
export interface OrchestratorStatus {
  state: 'running' | 'paused' | 'stopped';
  activeEntities: number;
  runningTasks: number;
  uptime: number;
}
