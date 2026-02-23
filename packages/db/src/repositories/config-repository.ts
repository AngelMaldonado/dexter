import { eq } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { DexterDb } from '../connection.js';
import { llmConfigs, mcpConfigs, boardConfigs, orgConfig } from '../schema.js';

type LLMConfigRow = typeof llmConfigs.$inferSelect;
type LLMConfigInsert = typeof llmConfigs.$inferInsert;
type MCPConfigRow = typeof mcpConfigs.$inferSelect;
type MCPConfigInsert = typeof mcpConfigs.$inferInsert;
type BoardConfigRow = typeof boardConfigs.$inferSelect;
type BoardConfigInsert = typeof boardConfigs.$inferInsert;
type OrgConfigRow = typeof orgConfig.$inferSelect;
type OrgConfigInsert = typeof orgConfig.$inferInsert;

export class ConfigRepository {
  constructor(private db: DexterDb) {}

  // ─── LLM Configs ────────────────────────────────────────────────
  getLLMConfigs(): LLMConfigRow[] {
    return this.db.select().from(llmConfigs).all();
  }

  getLLMConfig(id: string): LLMConfigRow | undefined {
    return this.db.select().from(llmConfigs).where(eq(llmConfigs.id, id)).get();
  }

  createLLMConfig(input: Omit<LLMConfigInsert, 'id' | 'createdAt'>): LLMConfigRow {
    const row: LLMConfigInsert = {
      id: ulid(),
      ...input,
      createdAt: new Date().toISOString(),
    };
    this.db.insert(llmConfigs).values(row).run();
    return this.db.select().from(llmConfigs).where(eq(llmConfigs.id, row.id!)).get()!;
  }

  updateLLMConfig(id: string, updates: Partial<Omit<LLMConfigInsert, 'id' | 'createdAt'>>): void {
    this.db.update(llmConfigs).set(updates).where(eq(llmConfigs.id, id)).run();
  }

  deleteLLMConfig(id: string): void {
    this.db.delete(llmConfigs).where(eq(llmConfigs.id, id)).run();
  }

  // ─── MCP Configs ────────────────────────────────────────────────
  getMCPConfigs(): MCPConfigRow[] {
    return this.db.select().from(mcpConfigs).all();
  }

  getMCPConfig(id: string): MCPConfigRow | undefined {
    return this.db.select().from(mcpConfigs).where(eq(mcpConfigs.id, id)).get();
  }

  createMCPConfig(input: Omit<MCPConfigInsert, 'id' | 'createdAt'>): MCPConfigRow {
    const row: MCPConfigInsert = {
      id: ulid(),
      ...input,
      createdAt: new Date().toISOString(),
    };
    this.db.insert(mcpConfigs).values(row).run();
    return this.db.select().from(mcpConfigs).where(eq(mcpConfigs.id, row.id!)).get()!;
  }

  updateMCPConfig(id: string, updates: Partial<Omit<MCPConfigInsert, 'id' | 'createdAt'>>): void {
    this.db.update(mcpConfigs).set(updates).where(eq(mcpConfigs.id, id)).run();
  }

  deleteMCPConfig(id: string): void {
    this.db.delete(mcpConfigs).where(eq(mcpConfigs.id, id)).run();
  }

  // ─── Board Configs ──────────────────────────────────────────────
  getBoardConfigs(): BoardConfigRow[] {
    return this.db.select().from(boardConfigs).all();
  }

  getBoardConfig(id: string): BoardConfigRow | undefined {
    return this.db.select().from(boardConfigs).where(eq(boardConfigs.id, id)).get();
  }

  createBoardConfig(input: Omit<BoardConfigInsert, 'id' | 'createdAt'>): BoardConfigRow {
    const row: BoardConfigInsert = {
      id: ulid(),
      ...input,
      createdAt: new Date().toISOString(),
    };
    this.db.insert(boardConfigs).values(row).run();
    return this.db.select().from(boardConfigs).where(eq(boardConfigs.id, row.id!)).get()!;
  }

  updateBoardConfig(id: string, updates: Partial<Omit<BoardConfigInsert, 'id' | 'createdAt'>>): void {
    this.db.update(boardConfigs).set(updates).where(eq(boardConfigs.id, id)).run();
  }

  deleteBoardConfig(id: string): void {
    this.db.delete(boardConfigs).where(eq(boardConfigs.id, id)).run();
  }

  // ─── Org Config ─────────────────────────────────────────────────
  getOrgConfig(): OrgConfigRow | undefined {
    return this.db.select().from(orgConfig).get();
  }

  updateOrgConfig(updates: Partial<Omit<OrgConfigInsert, 'id'>>): void {
    const existing = this.getOrgConfig();
    if (existing) {
      this.db
        .update(orgConfig)
        .set({ ...updates, updatedAt: new Date().toISOString() })
        .where(eq(orgConfig.id, existing.id))
        .run();
    } else {
      this.db
        .insert(orgConfig)
        .values({
          id: ulid(),
          ...updates,
          updatedAt: new Date().toISOString(),
        })
        .run();
    }
  }
}
