// Connection
export { createDatabase } from './connection.js';
export type { DexterDb } from './connection.js';

// Migration
export { runMigrations, initializeDatabase } from './migrate.js';

// Schema
export * from './schema.js';

// Repositories
export { EntityRepository } from './repositories/entity-repository.js';
export { TaskRepository } from './repositories/task-repository.js';
export { DepartmentRepository } from './repositories/department-repository.js';
export { ActivityRepository } from './repositories/activity-repository.js';
export { ExecutionRepository } from './repositories/execution-repository.js';
export { MemoryRepository } from './repositories/memory-repository.js';
export { GamificationRepository } from './repositories/gamification-repository.js';
export type { LeaderboardEntry } from './repositories/gamification-repository.js';
export { ConfigRepository } from './repositories/config-repository.js';

// Seed
export { seed } from './seed.js';
