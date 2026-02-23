export type LLMProviderType = 'anthropic' | 'openai' | 'ollama';

export interface LLMConfig {
  id: string;
  name: string;
  provider: LLMProviderType;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  maxTokens: number;
  temperature: number;
  createdAt: string;
}
