import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from './schema.js';

export function createDatabase(path: string = 'dexter.db') {
  const sqlite = new Database(path);
  sqlite.exec('PRAGMA journal_mode = WAL');
  sqlite.exec('PRAGMA foreign_keys = ON');
  return drizzle(sqlite, { schema });
}

export type DexterDb = ReturnType<typeof createDatabase>;
