import Anthropic from '@anthropic-ai/sdk';
import type { LLMProvider, LLMMessage, LLMRequestOptions, LLMResponse } from '@dexter/core';

export class ClaudeLLMProvider implements LLMProvider {
  readonly name = 'claude';
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async chat(model: string, messages: LLMMessage[], options?: LLMRequestOptions): Promise<LLMResponse> {
    const systemMessage = messages.find(m => m.role === 'system');
    const chatMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const start = Date.now();
    const response = await this.client.messages.create({
      model,
      max_tokens: options?.maxTokens ?? 4096,
      temperature: options?.temperature,
      stop_sequences: options?.stopSequences,
      system: systemMessage?.content,
      messages: chatMessages,
    });
    const durationMs = Date.now() - start;

    const content = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');

    return {
      content,
      model: response.model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      durationMs,
    };
  }
}
