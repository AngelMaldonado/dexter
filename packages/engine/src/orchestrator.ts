import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Task, Entity, MCPServerConfig, DexterEvent } from '@dexter/core';
import { EventBus } from './event-bus.js';
import { EntityManager } from './entity-manager.js';
import { EntityRuntime } from './entity-runtime.js';
import { Scheduler } from './scheduler.js';
import { MCPManager } from './mcp-manager.js';
import { MemoryManager } from './memory-manager.js';
import { EnergySystem } from './energy-system.js';
import { GamificationEngine } from './gamification-engine.js';

export interface OrchestratorConfig {
  mcpServers?: MCPServerConfig[];
}

export class Orchestrator {
  readonly eventBus: EventBus;
  readonly entityManager: EntityManager;
  readonly scheduler: Scheduler;
  readonly mcpManager: MCPManager;
  readonly memoryManager: MemoryManager;
  readonly energySystem: EnergySystem;
  readonly gamificationEngine: GamificationEngine;
  private runtime: EntityRuntime;
  private llmProviders = new Map<string, BaseChatModel>();
  private defaultLLMProvider: BaseChatModel | null = null;

  constructor(config?: OrchestratorConfig) {
    this.eventBus = new EventBus();
    this.entityManager = new EntityManager(this.eventBus);
    this.scheduler = new Scheduler();
    this.mcpManager = new MCPManager();
    this.memoryManager = new MemoryManager(this.eventBus);
    this.energySystem = new EnergySystem(this.eventBus, this.entityManager);
    this.gamificationEngine = new GamificationEngine(this.eventBus, this.entityManager);
    this.runtime = new EntityRuntime(this.eventBus, this.energySystem);

    if (config?.mcpServers) {
      for (const server of config.mcpServers) {
        this.mcpManager.connectServer(server).catch(err => {
          console.error(`Failed to connect MCP server ${server.name}:`, err);
        });
      }
    }
  }

  registerLLMProvider(name: string, provider: BaseChatModel, isDefault = false): void {
    this.llmProviders.set(name, provider);
    if (isDefault || !this.defaultLLMProvider) {
      this.defaultLLMProvider = provider;
    }
  }

  async assignAndExecute(task: Task, entityId?: string): Promise<string> {
    let entity: Entity | undefined;

    if (entityId) {
      entity = this.entityManager.getEntity(entityId);
      if (!entity) throw new Error(`Entity ${entityId} not found`);
    } else {
      const all = this.entityManager.getAllEntities();
      const best = this.scheduler.findBestEntity(task, all);
      if (!best) throw new Error('No available entity for this task');
      entity = best;
    }

    // Check if entity should take a break
    if (this.energySystem.shouldTakeBreak(entity.id)) {
      this.entityManager.transitionState(entity.id, 'on_break');
      throw new Error(`Entity ${entity.name} needs a break (low energy)`);
    }

    // Assign task
    this.eventBus.emit({
      type: 'task:assigned',
      timestamp: new Date().toISOString(),
      payload: { taskId: task.id, entityId: entity.id },
    });

    // Transition to working
    this.entityManager.transitionState(entity.id, 'working');

    // Get LLM provider
    const llm = this.defaultLLMProvider;
    if (!llm) throw new Error('No LLM provider registered');

    // Get MCP tools for entity
    const mcpTools = this.mcpManager.getToolsForEntity(entity);

    // Get relevant memories (used for context enrichment in the future)
    const _memories = this.memoryManager.getRelevantMemories(entity.id, task.description);

    try {
      const result = await this.runtime.executeTask({
        entity,
        task,
        llm,
        tools: mcpTools,
      });

      // Store memory of completed task
      this.memoryManager.storeMemory(
        entity.id,
        'episodic',
        `Completed task: ${task.title} - ${result.slice(0, 200)}`,
        task.id,
      );

      // Update mood based on success
      this.energySystem.updateMood(entity.id, 'success');

      // Transition back to idle
      this.entityManager.transitionState(entity.id, 'idle');

      return result;
    } catch (error) {
      // Update mood based on failure
      this.energySystem.updateMood(entity.id, 'failure');

      // Transition back to idle
      try {
        this.entityManager.transitionState(entity.id, 'idle');
      } catch {
        // Entity might already be in a valid state
      }

      throw error;
    }
  }

  async shutdown(): Promise<void> {
    await this.mcpManager.disconnectAll();
  }
}
