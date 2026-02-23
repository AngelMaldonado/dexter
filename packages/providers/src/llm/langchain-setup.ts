import { ChatAnthropic } from '@langchain/anthropic';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { LLMConfig } from '@dexter/core';

export function createLLMProvider(config: LLMConfig): BaseChatModel {
  switch (config.provider) {
    case 'anthropic':
      return new ChatAnthropic({
        model: config.model,
        maxTokens: config.maxTokens,
        temperature: config.temperature,
        anthropicApiKey: config.apiKey,
      });
    // Future: case 'openai', case 'ollama'
    default:
      throw new Error(`Unsupported LLM provider: ${config.provider}`);
  }
}
