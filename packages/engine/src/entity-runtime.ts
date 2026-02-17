import type { Entity, Task, LLMProvider, LLMMessage } from '@dexter/core';
import { soulToSystemPrompt, parseSoul } from '@dexter/core';
import { ExecutionRepository } from '@dexter/db';
import type { DexterDb } from '@dexter/db';
import { readFileSync } from 'fs';
import { EventBus } from './event-bus.js';

export class EntityRuntime {
  private executionRepo: ExecutionRepository;

  constructor(
    private db: DexterDb,
    private eventBus: EventBus,
  ) {
    this.executionRepo = new ExecutionRepository(db);
  }

  async executeTask(entity: Entity, task: Task, llmProvider: LLMProvider): Promise<string> {
    const soulContent = readFileSync(entity.soulPath, 'utf-8');
    const soul = parseSoul(soulContent);
    const systemPrompt = soulToSystemPrompt(soul);

    const moodModifier = getMoodModifier(entity.mood);
    const energyModifier = getEnergyModifier(entity.energy);

    const fullSystemPrompt = [
      systemPrompt,
      moodModifier,
      energyModifier,
      `\nYour current skills: ${entity.skills.join(', ')}`,
    ]
      .filter(Boolean)
      .join('\n');

    const messages: LLMMessage[] = [
      { role: 'system', content: fullSystemPrompt },
      {
        role: 'user',
        content: `Task: ${task.title}\n\nDescription: ${task.description}\n\nPriority: ${task.priority}\nRequired skills: ${task.skills.join(', ') || 'none specified'}`,
      },
    ];

    const run = this.executionRepo.create({
      taskId: task.id,
      entityId: entity.id,
      prompt: JSON.stringify(messages),
    });

    this.eventBus.emit({
      type: 'execution:started',
      runId: run.id,
      taskId: task.id,
      entityId: entity.id,
      timestamp: new Date().toISOString(),
    });

    try {
      const response = await llmProvider.chat(
        'claude-sonnet-4-5-20250929', // default model, should come from entity's llm config
        messages,
        { maxTokens: 4096 },
      );

      this.executionRepo.complete(run.id, {
        result: response.content,
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
        durationMs: response.durationMs,
      });

      this.eventBus.emit({
        type: 'execution:completed',
        runId: run.id,
        taskId: task.id,
        entityId: entity.id,
        result: response.content,
        timestamp: new Date().toISOString(),
      });

      return response.content;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.executionRepo.fail(run.id, errMsg);
      throw error;
    }
  }
}

function getMoodModifier(mood: string): string {
  switch (mood) {
    case 'happy':
      return '\nYou are feeling enthusiastic and positive today.';
    case 'frustrated':
      return '\nYou are feeling a bit frustrated. Try to stay focused and methodical.';
    case 'tired':
      return '\nYou are feeling tired. Keep responses concise and focused.';
    case 'excited':
      return '\nYou are feeling excited and energized about this work!';
    default:
      return '';
  }
}

function getEnergyModifier(energy: number): string {
  if (energy > 80) return '';
  if (energy > 50) return '\nYou are at moderate energy. Focus on the essentials.';
  if (energy > 20) return '\nYou are running low on energy. Be brief and efficient.';
  return '\nYou are very low on energy. Provide only the minimum necessary response.';
}
