import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { sql } from 'drizzle-orm';
import * as schema from './schema.js';

export function initializeDatabase(dbPath = 'dexter.db') {
  const sqlite = new Database(dbPath);
  sqlite.exec('PRAGMA journal_mode = WAL');
  sqlite.exec('PRAGMA foreign_keys = ON');
  const db = drizzle(sqlite, { schema });

  db.run(sql`CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL DEFAULT '#6366f1',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
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
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS board_configs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    credentials TEXT NOT NULL,
    board_id TEXT NOT NULL,
    mappings TEXT NOT NULL DEFAULT '{}',
    sync_enabled INTEGER NOT NULL DEFAULT 0,
    poll_interval_ms INTEGER NOT NULL DEFAULT 60000,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS entities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    department_id TEXT REFERENCES departments(id),
    skills TEXT NOT NULL DEFAULT '[]',
    personality TEXT NOT NULL DEFAULT '[]',
    communication TEXT NOT NULL DEFAULT '',
    rules TEXT NOT NULL DEFAULT '[]',
    backstory TEXT NOT NULL DEFAULT '',
    state TEXT NOT NULL DEFAULT 'idle',
    mood TEXT NOT NULL DEFAULT 'neutral',
    energy INTEGER NOT NULL DEFAULT 100,
    avatar_url TEXT,
    llm_config_id TEXT REFERENCES llm_configs(id),
    soul_path TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'backlog',
    priority TEXT NOT NULL DEFAULT 'medium',
    skills TEXT NOT NULL DEFAULT '[]',
    assignee_id TEXT REFERENCES entities(id),
    department_id TEXT REFERENCES departments(id),
    board_card_id TEXT,
    board_config_id TEXT REFERENCES board_configs(id),
    estimated_minutes INTEGER,
    actual_minutes INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
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
    prompt TEXT NOT NULL,
    result TEXT,
    error TEXT,
    input_tokens INTEGER,
    output_tokens INTEGER,
    duration_ms INTEGER,
    started_at TEXT NOT NULL,
    completed_at TEXT
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    from_entity_id TEXT NOT NULL REFERENCES entities(id),
    to_entity_id TEXT NOT NULL REFERENCES entities(id),
    content TEXT NOT NULL,
    task_id TEXT REFERENCES tasks(id),
    created_at TEXT NOT NULL
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS achievement_definitions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '🏆',
    points INTEGER NOT NULL DEFAULT 10,
    criteria TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS entity_achievements (
    id TEXT PRIMARY KEY,
    entity_id TEXT NOT NULL REFERENCES entities(id),
    achievement_id TEXT NOT NULL REFERENCES achievement_definitions(id),
    unlocked_at TEXT NOT NULL
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS entity_daily_stats (
    id TEXT PRIMARY KEY,
    entity_id TEXT NOT NULL REFERENCES entities(id),
    date TEXT NOT NULL,
    tasks_completed INTEGER NOT NULL DEFAULT 0,
    tasks_failed INTEGER NOT NULL DEFAULT 0,
    total_work_minutes INTEGER NOT NULL DEFAULT 0,
    average_energy REAL NOT NULL DEFAULT 100,
    average_mood TEXT NOT NULL DEFAULT 'neutral'
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS activity_log (
    id TEXT PRIMARY KEY,
    entity_id TEXT REFERENCES entities(id),
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata TEXT,
    created_at TEXT NOT NULL
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS org_config (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);

  return db;
}
