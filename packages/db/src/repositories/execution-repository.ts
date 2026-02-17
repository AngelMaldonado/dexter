import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { DexterDb } from '../connection.js';
import { executionRuns } from '../schema.js';

export interface ExecutionRun {
  id: string;
  taskId: string;
  entityId: string;
  status: 'running' | 'completed' | 'failed';
  prompt: string;
  result: string | null;
  error: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  durationMs: number | null;
  startedAt: string;
  completedAt: string | null;
}

export class ExecutionRepository {
  constructor(private db: DexterDb) {}

  findById(id: string): ExecutionRun | undefined {
    const row = this.db.select().from(executionRuns).where(eq(executionRuns.id, id)).get();
    return row ? (row as ExecutionRun) : undefined;
  }

  findByTask(taskId: string): ExecutionRun[] {
    return this.db.select().from(executionRuns).where(eq(executionRuns.taskId, taskId)).all() as ExecutionRun[];
  }

  findByEntity(entityId: string): ExecutionRun[] {
    return this.db.select().from(executionRuns).where(eq(executionRuns.entityId, entityId)).all() as ExecutionRun[];
  }

  create(input: { taskId: string; entityId: string; prompt: string }): ExecutionRun {
    const row = {
      id: ulid(),
      taskId: input.taskId,
      entityId: input.entityId,
      status: 'running',
      prompt: input.prompt,
      result: null,
      error: null,
      inputTokens: null,
      outputTokens: null,
      durationMs: null,
      startedAt: new Date().toISOString(),
      completedAt: null,
    };
    this.db.insert(executionRuns).values(row).run();
    return row as ExecutionRun;
  }

  complete(id: string, result: { result: string; inputTokens: number; outputTokens: number; durationMs: number }): void {
    this.db
      .update(executionRuns)
      .set({
        status: 'completed',
        result: result.result,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        durationMs: result.durationMs,
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
}
