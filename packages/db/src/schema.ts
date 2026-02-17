import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const entities = sqliteTable('entities', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  departmentId: text('department_id').references(() => departments.id),
  skills: text('skills').notNull().default('[]'), // JSON array
  personality: text('personality').notNull().default('[]'), // JSON array
  communication: text('communication').notNull().default(''),
  rules: text('rules').notNull().default('[]'), // JSON array
  backstory: text('backstory').notNull().default(''),
  state: text('state').notNull().default('idle'),
  mood: text('mood').notNull().default('neutral'),
  energy: integer('energy').notNull().default(100),
  avatarUrl: text('avatar_url'),
  llmConfigId: text('llm_config_id').references(() => llmConfigs.id),
  soulPath: text('soul_path').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const departments = sqliteTable('departments', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  color: text('color').notNull().default('#6366f1'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  status: text('status').notNull().default('backlog'),
  priority: text('priority').notNull().default('medium'),
  skills: text('skills').notNull().default('[]'), // JSON array
  assigneeId: text('assignee_id').references(() => entities.id),
  departmentId: text('department_id').references(() => departments.id),
  boardCardId: text('board_card_id'),
  boardConfigId: text('board_config_id').references(() => boardConfigs.id),
  estimatedMinutes: integer('estimated_minutes'),
  actualMinutes: integer('actual_minutes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  completedAt: text('completed_at'),
});

export const taskDependencies = sqliteTable('task_dependencies', {
  taskId: text('task_id').notNull().references(() => tasks.id),
  dependsOnTaskId: text('depends_on_task_id').notNull().references(() => tasks.id),
});

export const executionRuns = sqliteTable('execution_runs', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull().references(() => tasks.id),
  entityId: text('entity_id').notNull().references(() => entities.id),
  status: text('status').notNull().default('running'), // running, completed, failed
  prompt: text('prompt').notNull(),
  result: text('result'),
  error: text('error'),
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  durationMs: integer('duration_ms'),
  startedAt: text('started_at').notNull(),
  completedAt: text('completed_at'),
});

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  fromEntityId: text('from_entity_id').notNull().references(() => entities.id),
  toEntityId: text('to_entity_id').notNull().references(() => entities.id),
  content: text('content').notNull(),
  taskId: text('task_id').references(() => tasks.id),
  createdAt: text('created_at').notNull(),
});

export const achievementDefinitions = sqliteTable('achievement_definitions', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(), // streak, milestone, performance, social
  icon: text('icon').notNull().default('🏆'),
  points: integer('points').notNull().default(10),
  criteria: text('criteria').notNull(), // JSON
  createdAt: text('created_at').notNull(),
});

export const entityAchievements = sqliteTable('entity_achievements', {
  id: text('id').primaryKey(),
  entityId: text('entity_id').notNull().references(() => entities.id),
  achievementId: text('achievement_id').notNull().references(() => achievementDefinitions.id),
  unlockedAt: text('unlocked_at').notNull(),
});

export const entityDailyStats = sqliteTable('entity_daily_stats', {
  id: text('id').primaryKey(),
  entityId: text('entity_id').notNull().references(() => entities.id),
  date: text('date').notNull(),
  tasksCompleted: integer('tasks_completed').notNull().default(0),
  tasksFailed: integer('tasks_failed').notNull().default(0),
  totalWorkMinutes: integer('total_work_minutes').notNull().default(0),
  averageEnergy: real('average_energy').notNull().default(100),
  averageMood: text('average_mood').notNull().default('neutral'),
});

export const activityLog = sqliteTable('activity_log', {
  id: text('id').primaryKey(),
  entityId: text('entity_id').references(() => entities.id),
  type: text('type').notNull(),
  message: text('message').notNull(),
  metadata: text('metadata'), // JSON
  createdAt: text('created_at').notNull(),
});

export const boardConfigs = sqliteTable('board_configs', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  provider: text('provider').notNull(),
  credentials: text('credentials').notNull(), // encrypted JSON
  boardId: text('board_id').notNull(),
  mappings: text('mappings').notNull().default('{}'), // JSON
  syncEnabled: integer('sync_enabled', { mode: 'boolean' }).notNull().default(false),
  pollIntervalMs: integer('poll_interval_ms').notNull().default(60000),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const llmConfigs = sqliteTable('llm_configs', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  provider: text('provider').notNull(),
  model: text('model').notNull(),
  apiKey: text('api_key'),
  baseUrl: text('base_url'),
  maxTokens: integer('max_tokens').notNull().default(4096),
  temperature: real('temperature').notNull().default(0.7),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const orgConfig = sqliteTable('org_config', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').notNull(),
});
