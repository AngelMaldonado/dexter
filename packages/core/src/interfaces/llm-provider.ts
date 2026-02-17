import type { LLMMessage, LLMRequestOptions, LLMResponse } from '../types/llm.js';

export interface LLMProvider {
  readonly name: string;
  chat(model: string, messages: LLMMessage[], options?: LLMRequestOptions): Promise<LLMResponse>;
}
