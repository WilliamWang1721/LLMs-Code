/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { LLMAdapter, LLMAdapterFactory, ModelProvider } from './LLMAdapter.js';
import { OpenAIAdapter } from './OpenAIAdapter.js';
import { AnthropicAdapter } from './AnthropicAdapter.js';
import { GeminiAdapter } from './GeminiAdapter.js';

/**
 * LLM适配器工厂实现
 * 负责创建不同模型提供商的适配器实例
 */
export class DefaultLLMAdapterFactory implements LLMAdapterFactory {
  /**
   * 创建适配器实例
   * @param provider 模型提供商
   * @returns 适配器实例
   * @throws 如果提供商不支持
   */
  createAdapter(provider: ModelProvider): LLMAdapter {
    switch (provider) {
      case ModelProvider.OPENAI:
        return new OpenAIAdapter();
      case ModelProvider.ANTHROPIC:
        return new AnthropicAdapter();
      case ModelProvider.GEMINI:
        return new GeminiAdapter();
      default:
        throw new Error(`不支持的模型提供商: ${provider}`);
    }
  }
} 