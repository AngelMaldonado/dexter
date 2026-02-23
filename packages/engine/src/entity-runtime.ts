import { Annotation, StateGraph, messagesStateReducer } from '@langchain/langgraph';
import type { BaseMessage } from '@langchain/core/messages';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Entity, Task } from '@dexter/core';
import { soulToSystemPrompt } from '@dexter/core';
import { EventBus } from './event-bus.js';
import { EnergySystem } from './energy-system.js';

const EntityRuntimeState = Annotation.Root({
  entityId: Annotation<string>,
  taskId: Annotation<string>,
  systemPrompt: Annotation<string>,
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  plan: Annotation<string>,
  result: Annotation<string>,
  retryCount: Annotation<number>,
  maxRetries: Annotation<number>,
  status: Annotation<'planning' | 'executing' | 'validating' | 'complete' | 'failed'>,
});

export type EntityRuntimeStateType = typeof EntityRuntimeState.State;

export interface EntityRuntimeConfig {
  entity: Entity;
  task: Task;
  llm: BaseChatModel;
  tools?: Array<{ name: string; description: string; inputSchema: Record<string, unknown> }>;
}

export class EntityRuntime {
  constructor(
    private eventBus: EventBus,
    private energySystem: EnergySystem,
  ) {}

  async executeTask(config: EntityRuntimeConfig): Promise<string> {
    const { entity, task, llm, tools } = config;

    this.eventBus.emit({
      type: 'task:started',
      timestamp: new Date().toISOString(),
      payload: { taskId: task.id, entityId: entity.id },
    });

    const systemPrompt = this.buildSystemPrompt(entity, task);

    const graph = this.buildGraph(llm);

    try {
      const finalState = await graph.invoke({
        entityId: entity.id,
        taskId: task.id,
        systemPrompt,
        messages: [],
        plan: '',
        result: '',
        retryCount: 0,
        maxRetries: 2,
        status: 'planning' as const,
      });

      if (finalState.status === 'failed') {
        this.eventBus.emit({
          type: 'task:failed',
          timestamp: new Date().toISOString(),
          payload: {
            taskId: task.id,
            entityId: entity.id,
            error: finalState.result || 'Task failed after retries',
          },
        });
        throw new Error(finalState.result || 'Task failed after retries');
      }

      this.energySystem.drainEnergy(entity.id, entity.energyDrainRate);

      this.eventBus.emit({
        type: 'task:completed',
        timestamp: new Date().toISOString(),
        payload: {
          taskId: task.id,
          entityId: entity.id,
          tokensUsed: 0,
          cost: 0,
        },
      });

      return finalState.result;
    } catch (error) {
      if (!(error instanceof Error && error.message.includes('Task failed after retries'))) {
        this.eventBus.emit({
          type: 'task:failed',
          timestamp: new Date().toISOString(),
          payload: {
            taskId: task.id,
            entityId: entity.id,
            error: error instanceof Error ? error.message : String(error),
          },
        });
      }
      throw error;
    }
  }

  private buildGraph(llm: BaseChatModel) {
    const planningNode = async (state: typeof EntityRuntimeState.State) => {
      const messages = [
        new SystemMessage(state.systemPrompt),
        new HumanMessage(
          `Create a step-by-step plan to complete this task, then execute it. Be concise.`,
        ),
      ];

      const response = await llm.invoke(messages);
      const plan = typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

      return {
        messages: [...messages, response],
        plan,
        status: 'executing' as const,
      };
    };

    const executionNode = async (state: typeof EntityRuntimeState.State) => {
      const execMessage = new HumanMessage(
        `Execute the plan you created. Provide the final result.`,
      );

      const response = await llm.invoke([...state.messages, execMessage]);
      const result = typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

      return {
        messages: [execMessage, response],
        result,
        status: 'validating' as const,
      };
    };

    const validationNode = async (state: typeof EntityRuntimeState.State) => {
      const validationMessage = new HumanMessage(
        `Review your result. Is it complete and correct? Reply with VALID if yes, or RETRY with explanation if not.`,
      );

      const response = await llm.invoke([...state.messages, validationMessage]);
      const content = typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

      const isValid = content.toUpperCase().includes('VALID');

      if (isValid) {
        return {
          messages: [validationMessage, response],
          status: 'complete' as const,
        };
      }

      return {
        messages: [validationMessage, response],
        retryCount: state.retryCount + 1,
        status: (state.retryCount + 1 >= state.maxRetries ? 'failed' : 'executing') as
          'failed' | 'executing',
      };
    };

    const routeAfterValidation = (state: typeof EntityRuntimeState.State) => {
      if (state.status === 'complete') return 'complete';
      if (state.status === 'failed') return 'failed';
      return 'execution';
    };

    const completeNode = async (_state: typeof EntityRuntimeState.State) => {
      return { status: 'complete' as const };
    };

    const failedNode = async (state: typeof EntityRuntimeState.State) => {
      return {
        status: 'failed' as const,
        result: state.result || 'Task failed after maximum retries',
      };
    };

    const graph = new StateGraph(EntityRuntimeState)
      .addNode('planning', planningNode)
      .addNode('execution', executionNode)
      .addNode('validation', validationNode)
      .addNode('complete', completeNode)
      .addNode('failed', failedNode)
      .addEdge('__start__', 'planning')
      .addEdge('planning', 'execution')
      .addEdge('execution', 'validation')
      .addConditionalEdges('validation', routeAfterValidation, [
        'complete',
        'failed',
        'execution',
      ])
      .addEdge('complete', '__end__')
      .addEdge('failed', '__end__')
      .compile();

    return graph;
  }

  private buildSystemPrompt(entity: Entity, task: Task): string {
    const soulPrompt = soulToSystemPrompt(entity.parsedSoul);
    const moodModifier = this.energySystem.getMoodModifier(entity.mood);

    const parts = [
      soulPrompt,
      moodModifier,
      `\nCurrent energy: ${entity.energy}/100`,
      `\nTask: ${task.title}`,
      `Description: ${task.description}`,
      `Priority: ${task.priority}`,
      `Required skills: ${task.requiredSkills.join(', ') || 'none specified'}`,
    ];

    return parts.filter(Boolean).join('\n');
  }
}
