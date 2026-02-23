import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { DexterDb } from '../connection.js';
import { executionRuns } from '../schema.js';

type ExecutionRow = typeof executionRuns.$inferSelect;
type ExecutionInsert = typeof executionRuns.$inferInsert;

export class ExecutionRepository {
  constructor(private db: DexterDb) {}

  findByTask(taskId: string): ExecutionRow[] {
    return this.db.select().from(executionRuns).where(eq(executionRuns.taskId, taskId)).all();
  }

  findByEntity(entityId: string): ExecutionRow[] {
    return this.db.select().from(executionRuns).where(eq(executionRuns.entityId, entityId)).all();
  }

  create(input: Omit<ExecutionInsert, 'id' | 'startedAt'>): ExecutionRow {
    const row: ExecutionInsert = {
      id: ulid(),
      ...input,
      startedAt: new Date().toISOString(),
    };
    this.db.insert(executionRuns).values(row).run();
    return this.findById(row.id!)!;
  }

  complete(id: string, result: string, tokens: { input: number; output: number; total: number }, cost: number, durationMs: number): void {
    this.db
      .update(executionRuns)
      .set({
        status: 'completed',
        result,
        inputTokens: tokens.input,
        outputTokens: tokens.output,
        totalTokens: tokens.total,
        cost,
        durationMs,
        completedAt: new Date().toISOString(),
      })
      .where(eq(executionRuns.id, id))
      .run();
  }

  fail(id: string, error: string): void {
    this.db
      .update(executionRuns)
      .set({
        status: 'failed',
        error,
        completedAt: new Date().toISOString(),
      })
      .where(eq(executionRuns.id, id))
      .run();
  }

  private findById(id: string): ExecutionRow | undefined {
    return this.db.select().from(executionRuns).where(eq(executionRuns.id, id)).get();
  }
}
