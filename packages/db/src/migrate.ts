import { sql } from 'drizzle-orm';
import { createDatabase, type DexterDb } from './connection.js';

export function runMigrations(db: DexterDb) {
  db.run(sql`CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL DEFAULT '#6366f1',
    floor_zone_x INTEGER NOT NULL DEFAULT 0,
    floor_zone_y INTEGER NOT NULL DEFAULT 0,
    floor_zone_width INTEGER NOT NULL DEFAULT 200,
    floor_zone_height INTEGER NOT NULL DEFAULT 200,
    created_at TEXT NOT NULL DEFAULT (current_timestamp)
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS llm_configs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    api_key TEXT,
    base_url TEXT,
    max_tokens INTEGER NOT NULL DEFAULT 4096,
    temperature REAL NOT NULL DEFAULT 0.7,
    created_at TEXT NOT NULL DEFAULT (current_timestamp)
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS entities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    soul_md TEXT NOT NULL,
    department_id TEXT REFERENCES departments(id),
    hierarchy_role TEXT NOT NULL DEFAULT 'worker',
    behavior_mode TEXT NOT NULL DEFAULT 'autonomous',
    state TEXT NOT NULL DEFAULT 'idle',
    energy INTEGER NOT NULL DEFAULT 100,
    mood TEXT NOT NULL DEFAULT 'neutral',
    xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    desk_x INTEGER,
    desk_y INTEGER,
    llm_config_id TEXT REFERENCES llm_configs(id),
    max_concurrent_tasks INTEGER NOT NULL DEFAULT 1,
    energy_drain_rate REAL NOT NULL DEFAULT 10.0,
    energy_recovery_rate REAL NOT NULL DEFAULT 5.0,
    created_at TEXT NOT NULL DEFAULT (current_timestamp),
    updated_at TEXT NOT NULL DEFAULT (current_timestamp)
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'backlog',
    priority TEXT NOT NULL DEFAULT 'medium',
    required_skills TEXT NOT NULL DEFAULT '[]',
    assigned_entity_id TEXT REFERENCES entities(id),
    parent_task_id TEXT REFERENCES tasks(id),
    department_id TEXT REFERENCES departments(id),
    board_card_id TEXT,
    board_provider_id TEXT,
    estimated_effort INTEGER NOT NULL DEFAULT 5,
    actual_tokens_used INTEGER NOT NULL DEFAULT 0,
    actual_cost REAL NOT NULL DEFAULT 0.0,
    created_at TEXT NOT NULL DEFAULT (current_timestamp),
    updated_at TEXT NOT NULL DEFAULT (current_timestamp),
    completed_at TEXT
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS task_dependencies (
    task_id TEXT NOT NULL REFERENCES tasks(id),
    depends_on_task_id TEXT NOT NULL REFERENCES tasks(id),
    PRIMARY KEY (task_id, depends_on_task_id)
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS execution_runs (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES tasks(id),
    entity_id TEXT NOT NULL REFERENCES entities(id),
    status TEXT NOT NULL DEFAULT 'running',
    plan TEXT,
    result TEXT,
    error TEXT,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    cost REAL NOT NULL DEFAULT 0.0,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    retry_count INTEGER NOT NULL DEFAULT 0,
    started_at TEXT NOT NULL DEFAULT (current_timestamp),
    completed_at TEXT
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    from_entity_id TEXT NOT NULL REFERENCES entities(id),
    to_entity_id TEXT REFERENCES entities(id),
    content TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'chat',
    task_id TEXT REFERENCES tasks(id),
    created_at TEXT NOT NULL DEFAULT (current_timestamp)
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS entity_memories (
    id TEXT PRIMARY KEY,
    entity_id TEXT NOT NULL REFERENCES entities(id),
    memory_type TEXT NOT NULL,
    content TEXT NOT NULL,
    task_id TEXT REFERENCES tasks(id),
    relevance_keywords TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (current_timestamp)
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS achievement_definitions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '🏆',
    criteria TEXT NOT NULL DEFAULT '{}',
    xp_reward INTEGER NOT NULL DEFAULT 50,
    created_at TEXT NOT NULL DEFAULT (current_timestamp)
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS entity_achievements (
    entity_id TEXT NOT NULL REFERENCES entities(id),
    achievement_id TEXT NOT NULL REFERENCES achievement_definitions(id),
    unlocked_at TEXT NOT NULL DEFAULT (current_timestamp),
    PRIMARY KEY (entity_id, achievement_id)
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS entity_daily_stats (
    id TEXT PRIMARY KEY,
    entity_id TEXT NOT NULL REFERENCES entities(id),
    date TEXT NOT NULL,
    tasks_completed INTEGER NOT NULL DEFAULT 0,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    cost REAL NOT NULL DEFAULT 0.0,
    active_time_minutes INTEGER NOT NULL DEFAULT 0,
    xp_earned INTEGER NOT NULL DEFAULT 0,
    UNIQUE(entity_id, date)
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS xp_events (
    id TEXT PRIMARY KEY,
    entity_id TEXT NOT NULL REFERENCES entities(id),
    amount INTEGER NOT NULL,
    source TEXT NOT NULL,
    source_event_id TEXT,
    created_at TEXT NOT NULL DEFAULT (current_timestamp)
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS streaks (
    id TEXT PRIMARY KEY,
    entity_id TEXT NOT NULL REFERENCES entities(id),
    type TEXT NOT NULL,
    current_count INTEGER NOT NULL DEFAULT 0,
    longest_count INTEGER NOT NULL DEFAULT 0,
    last_activity_at TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (current_timestamp),
    UNIQUE(entity_id, type)
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS activity_log (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    entity_id TEXT REFERENCES entities(id),
    task_id TEXT REFERENCES tasks(id),
    description TEXT NOT NULL,
    metadata TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (current_timestamp)
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS board_configs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    provider_type TEXT NOT NULL,
    credentials TEXT NOT NULL DEFAULT '{}',
    board_id TEXT NOT NULL,
    poll_interval_ms INTEGER NOT NULL DEFAULT 60000,
    list_mapping TEXT NOT NULL DEFAULT '{}',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (current_timestamp)
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS mcp_configs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    command TEXT NOT NULL,
    args TEXT NOT NULL DEFAULT '[]',
    env TEXT NOT NULL DEFAULT '{}',
    capabilities TEXT NOT NULL DEFAULT '[]',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (current_timestamp)
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS org_config (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'Dexter Organization',
    conventions TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT (current_timestamp)
  )`);

  // ─── Indexes ────────────────────────────────────────────────────────
  db.run(sql`CREATE INDEX IF NOT EXISTS idx_entities_department ON entities(department_id)`);
  db.run(sql`CREATE INDEX IF NOT EXISTS idx_entities_state ON entities(state)`);
  db.run(sql`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`);
  db.run(sql`CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_entity_id)`);
  db.run(sql`CREATE INDEX IF NOT EXISTS idx_tasks_department ON tasks(department_id)`);
  db.run(sql`CREATE INDEX IF NOT EXISTS idx_execution_runs_task ON execution_runs(task_id)`);
  db.run(sql`CREATE INDEX IF NOT EXISTS idx_execution_runs_entity ON execution_runs(entity_id)`);
  db.run(sql`CREATE INDEX IF NOT EXISTS idx_messages_from ON messages(from_entity_id)`);
  db.run(sql`CREATE INDEX IF NOT EXISTS idx_messages_to ON messages(to_entity_id)`);
  db.run(sql`CREATE INDEX IF NOT EXISTS idx_entity_memories_entity ON entity_memories(entity_id)`);
  db.run(sql`CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_id)`);
  db.run(sql`CREATE INDEX IF NOT EXISTS idx_activity_log_type ON activity_log(event_type)`);
  db.run(sql`CREATE INDEX IF NOT EXISTS idx_xp_events_entity ON xp_events(entity_id)`);
  db.run(sql`CREATE INDEX IF NOT EXISTS idx_streaks_entity ON streaks(entity_id)`);
}

export function initializeDatabase(dbPath = 'dexter.db') {
  const db = createDatabase(dbPath);
  runMigrations(db);
  return db;
}
