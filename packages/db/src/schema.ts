import { sqliteTable, text, integer, real, primaryKey, uniqueIndex, index } from 'drizzle-orm/sqlite-core';

// ─── departments ────────────────────────────────────────────────────
export const departments = sqliteTable('departments', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description').notNull().default(''),
  color: text('color').notNull().default('#6366f1'),
  floorZoneX: integer('floor_zone_x').notNull().default(0),
  floorZoneY: integer('floor_zone_y').notNull().default(0),
  floorZoneWidth: integer('floor_zone_width').notNull().default(200),
  floorZoneHeight: integer('floor_zone_height').notNull().default(200),
  createdAt: text('created_at').notNull().default(new Date().toISOString()),
});

// ─── llm_configs ────────────────────────────────────────────────────
export const llmConfigs = sqliteTable('llm_configs', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  provider: text('provider').notNull(),
  model: text('model').notNull(),
  apiKey: text('api_key'),
  baseUrl: text('base_url'),
  maxTokens: integer('max_tokens').notNull().default(4096),
  temperature: real('temperature').notNull().default(0.7),
  createdAt: text('created_at').notNull().default(new Date().toISOString()),
});

// ─── entities ───────────────────────────────────────────────────────
export const entities = sqliteTable('entities', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  soulMd: text('soul_md').notNull(),
  departmentId: text('department_id').references(() => departments.id),
  hierarchyRole: text('hierarchy_role').notNull().default('worker'),
  behaviorMode: text('behavior_mode').notNull().default('autonomous'),
  state: text('state').notNull().default('idle'),
  energy: integer('energy').notNull().default(100),
  mood: text('mood').notNull().default('neutral'),
  xp: integer('xp').notNull().default(0),
  level: integer('level').notNull().default(1),
  deskX: integer('desk_x'),
  deskY: integer('desk_y'),
  llmConfigId: text('llm_config_id').references(() => llmConfigs.id),
  maxConcurrentTasks: integer('max_concurrent_tasks').notNull().default(1),
  energyDrainRate: real('energy_drain_rate').notNull().default(10.0),
  energyRecoveryRate: real('energy_recovery_rate').notNull().default(5.0),
  createdAt: text('created_at').notNull().default(new Date().toISOString()),
  updatedAt: text('updated_at').notNull().default(new Date().toISOString()),
}, (table) => [
  index('idx_entities_department').on(table.departmentId),
  index('idx_entities_state').on(table.state),
]);

// ─── tasks ──────────────────────────────────────────────────────────
export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  status: text('status').notNull().default('backlog'),
  priority: text('priority').notNull().default('medium'),
  requiredSkills: text('required_skills').notNull().default('[]'),
  assignedEntityId: text('assigned_entity_id').references(() => entities.id),
  parentTaskId: text('parent_task_id'), // self-reference, FK enforced at migration level
  departmentId: text('department_id').references(() => departments.id),
  boardCardId: text('board_card_id'),
  boardProviderId: text('board_provider_id'),
  estimatedEffort: integer('estimated_effort').notNull().default(5),
  actualTokensUsed: integer('actual_tokens_used').notNull().default(0),
  actualCost: real('actual_cost').notNull().default(0.0),
  createdAt: text('created_at').notNull().default(new Date().toISOString()),
  updatedAt: text('updated_at').notNull().default(new Date().toISOString()),
  completedAt: text('completed_at'),
}, (table) => [
  index('idx_tasks_status').on(table.status),
  index('idx_tasks_assigned').on(table.assignedEntityId),
  index('idx_tasks_department').on(table.departmentId),
]);

// ─── task_dependencies ──────────────────────────────────────────────
export const taskDependencies = sqliteTable('task_dependencies', {
  taskId: text('task_id').notNull().references(() => tasks.id),
  dependsOnTaskId: text('depends_on_task_id').notNull().references(() => tasks.id),
}, (table) => [
  primaryKey({ columns: [table.taskId, table.dependsOnTaskId] }),
]);

// ─── execution_runs ─────────────────────────────────────────────────
export const executionRuns = sqliteTable('execution_runs', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull().references(() => tasks.id),
  entityId: text('entity_id').notNull().references(() => entities.id),
  status: text('status').notNull().default('running'),
  plan: text('plan'),
  result: text('result'),
  error: text('error'),
  inputTokens: integer('input_tokens').notNull().default(0),
  outputTokens: integer('output_tokens').notNull().default(0),
  totalTokens: integer('total_tokens').notNull().default(0),
  cost: real('cost').notNull().default(0.0),
  durationMs: integer('duration_ms').notNull().default(0),
  retryCount: integer('retry_count').notNull().default(0),
  startedAt: text('started_at').notNull().default(new Date().toISOString()),
  completedAt: text('completed_at'),
}, (table) => [
  index('idx_execution_runs_task').on(table.taskId),
  index('idx_execution_runs_entity').on(table.entityId),
]);

// ─── messages ───────────────────────────────────────────────────────
export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  fromEntityId: text('from_entity_id').notNull().references(() => entities.id),
  toEntityId: text('to_entity_id').references(() => entities.id),
  content: text('content').notNull(),
  messageType: text('message_type').notNull().default('chat'),
  taskId: text('task_id').references(() => tasks.id),
  createdAt: text('created_at').notNull().default(new Date().toISOString()),
}, (table) => [
  index('idx_messages_from').on(table.fromEntityId),
  index('idx_messages_to').on(table.toEntityId),
]);

// ─── entity_memories ────────────────────────────────────────────────
export const entityMemories = sqliteTable('entity_memories', {
  id: text('id').primaryKey(),
  entityId: text('entity_id').notNull().references(() => entities.id),
  memoryType: text('memory_type').notNull(),
  content: text('content').notNull(),
  taskId: text('task_id').references(() => tasks.id),
  relevanceKeywords: text('relevance_keywords').notNull().default('[]'),
  createdAt: text('created_at').notNull().default(new Date().toISOString()),
}, (table) => [
  index('idx_entity_memories_entity').on(table.entityId),
]);

// ─── achievement_definitions ────────────────────────────────────────
export const achievementDefinitions = sqliteTable('achievement_definitions', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  icon: text('icon').notNull().default('🏆'),
  criteria: text('criteria').notNull().default('{}'),
  xpReward: integer('xp_reward').notNull().default(50),
  createdAt: text('created_at').notNull().default(new Date().toISOString()),
});

// ─── entity_achievements ────────────────────────────────────────────
export const entityAchievements = sqliteTable('entity_achievements', {
  entityId: text('entity_id').notNull().references(() => entities.id),
  achievementId: text('achievement_id').notNull().references(() => achievementDefinitions.id),
  unlockedAt: text('unlocked_at').notNull().default(new Date().toISOString()),
}, (table) => [
  primaryKey({ columns: [table.entityId, table.achievementId] }),
]);

// ─── entity_daily_stats ─────────────────────────────────────────────
export const entityDailyStats = sqliteTable('entity_daily_stats', {
  id: text('id').primaryKey(),
  entityId: text('entity_id').notNull().references(() => entities.id),
  date: text('date').notNull(),
  tasksCompleted: integer('tasks_completed').notNull().default(0),
  tokensUsed: integer('tokens_used').notNull().default(0),
  cost: real('cost').notNull().default(0.0),
  activeTimeMinutes: integer('active_time_minutes').notNull().default(0),
  xpEarned: integer('xp_earned').notNull().default(0),
}, (table) => [
  uniqueIndex('uq_entity_daily_stats').on(table.entityId, table.date),
]);

// ─── xp_events ──────────────────────────────────────────────────────
export const xpEvents = sqliteTable('xp_events', {
  id: text('id').primaryKey(),
  entityId: text('entity_id').notNull().references(() => entities.id),
  amount: integer('amount').notNull(),
  source: text('source').notNull(),
  sourceEventId: text('source_event_id'),
  createdAt: text('created_at').notNull().default(new Date().toISOString()),
}, (table) => [
  index('idx_xp_events_entity').on(table.entityId),
]);

// ─── streaks ────────────────────────────────────────────────────────
export const streaks = sqliteTable('streaks', {
  id: text('id').primaryKey(),
  entityId: text('entity_id').notNull().references(() => entities.id),
  type: text('type').notNull(),
  currentCount: integer('current_count').notNull().default(0),
  longestCount: integer('longest_count').notNull().default(0),
  lastActivityAt: text('last_activity_at'),
  isActive: integer('is_active').notNull().default(1),
  createdAt: text('created_at').notNull().default(new Date().toISOString()),
}, (table) => [
  index('idx_streaks_entity').on(table.entityId),
  uniqueIndex('uq_streaks_entity_type').on(table.entityId, table.type),
]);

// ─── activity_log ───────────────────────────────────────────────────
export const activityLog = sqliteTable('activity_log', {
  id: text('id').primaryKey(),
  eventType: text('event_type').notNull(),
  entityId: text('entity_id').references(() => entities.id),
  taskId: text('task_id').references(() => tasks.id),
  description: text('description').notNull(),
  metadata: text('metadata').notNull().default('{}'),
  createdAt: text('created_at').notNull().default(new Date().toISOString()),
}, (table) => [
  index('idx_activity_log_entity').on(table.entityId),
  index('idx_activity_log_type').on(table.eventType),
]);

// ─── board_configs ──────────────────────────────────────────────────
export const boardConfigs = sqliteTable('board_configs', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  providerType: text('provider_type').notNull(),
  credentials: text('credentials').notNull().default('{}'),
  boardId: text('board_id').notNull(),
  pollIntervalMs: integer('poll_interval_ms').notNull().default(60000),
  listMapping: text('list_mapping').notNull().default('{}'),
  isActive: integer('is_active').notNull().default(1),
  createdAt: text('created_at').notNull().default(new Date().toISOString()),
});

// ─── mcp_configs ────────────────────────────────────────────────────
export const mcpConfigs = sqliteTable('mcp_configs', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  command: text('command').notNull(),
  args: text('args').notNull().default('[]'),
  env: text('env').notNull().default('{}'),
  capabilities: text('capabilities').notNull().default('[]'),
  isActive: integer('is_active').notNull().default(1),
  createdAt: text('created_at').notNull().default(new Date().toISOString()),
});

// ─── org_config ─────────────────────────────────────────────────────
export const orgConfig = sqliteTable('org_config', {
  id: text('id').primaryKey(),
  name: text('name').notNull().default('Dexter Organization'),
  conventions: text('conventions').notNull().default(''),
  updatedAt: text('updated_at').notNull().default(new Date().toISOString()),
});
