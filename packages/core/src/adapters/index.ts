/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// 导出接口和类型
export {
  LLMAdapter,
  LLMAdapterFactory,
  ModelProvider,
  ModelConfig,
  StreamResponse,
  CompletionResponse,
  EmbeddingResponse,
  MessageRole,
  Message,
  ToolCallResult,
  LLMTool,
  GenerationParams
} from './LLMAdapter.js';

// 导出基础适配器
export { BaseLLMAdapter } from './BaseLLMAdapter.js';

// 导出适配器工厂
export { DefaultLLMAdapterFactory } from './LLMAdapterFactory.js';

// 导出具体适配器实现
export { OpenAIAdapter } from './OpenAIAdapter.js';
export { AnthropicAdapter } from './AnthropicAdapter.js';
export { GeminiAdapter } from './GeminiAdapter.js'; 