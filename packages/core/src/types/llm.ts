export type LLMProviderType = 'claude' | 'openai' | 'ollama' | 'openai-compatible';

export interface LLMConfig {
  id: string;
  name: string;
  provider: LLMProviderType;
  model: string;
  apiKey: string | null;
  baseUrl: string | null;
  maxTokens: number;
  temperature: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLLMConfigInput {
  name: string;
  provider: LLMProviderType;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
}

export interface LLMRequestOptions {
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
}
