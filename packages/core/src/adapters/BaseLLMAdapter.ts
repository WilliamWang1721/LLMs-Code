/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { LLMAdapter, ModelConfig, CompletionResponse, StreamResponse, EmbeddingResponse, GenerationParams } from './LLMAdapter.js';

/**
 * 基础LLM适配器类
 * 实现LLMAdapter接口的通用部分，可以被具体的适配器继承
 */
export abstract class BaseLLMAdapter implements LLMAdapter {
  protected config: ModelConfig | null = null;
  protected initialized = false;

  /**
   * 获取适配器名称
   */
  abstract getName(): string;

  /**
   * 获取适配器支持的模型列表
   */
  abstract getSupportedModels(): string[];

  /**
   * 初始化适配器
   * @param config 模型配置
   */
  async initialize(config: ModelConfig): Promise<void> {
    // 解析API密钥中的环境变量引用
    const apiKey = this.resolveApiKey(config.apiKey);
    this.config = {
      ...config,
      apiKey
    };
    this.initialized = true;
  }

  /**
   * 生成文本完成
   * @param params 生成参数
   */
  abstract generateCompletion(params: GenerationParams): Promise<CompletionResponse>;

  /**
   * 流式生成文本
   * @param params 生成参数
   * @param callback 流式回调函数
   */
  abstract generateCompletionStream(
    params: GenerationParams,
    callback: (response: StreamResponse) => void
  ): Promise<void>;

  /**
   * 生成嵌入向量
   * @param text 输入文本
   */
  abstract generateEmbedding(text: string): Promise<EmbeddingResponse>;

  /**
   * 获取模型的最大上下文长度
   */
  abstract getMaxContextLength(): number;

  /**
   * 获取模型的当前配置
   */
  getConfig(): ModelConfig {
    if (!this.config) {
      throw new Error('适配器尚未初始化');
    }
    return this.config;
  }

  /**
   * 检查API密钥是否有效
   */
  abstract validateApiKey(): Promise<boolean>;

  /**
   * 检查适配器是否已初始化
   */
  protected checkInitialized(): void {
    if (!this.initialized || !this.config) {
      throw new Error('适配器尚未初始化');
    }
  }

  /**
   * 解析API密钥中的环境变量引用
   * @param apiKey API密钥或环境变量引用
   * @returns 解析后的API密钥
   */
  private resolveApiKey(apiKey: string): string {
    if (apiKey.startsWith('env:')) {
      const envVarName = apiKey.substring(4);
      const envValue = process.env[envVarName];
      if (!envValue) {
        throw new Error(`环境变量 ${envVarName} 未设置`);
      }
      return envValue;
    }
    return apiKey;
  }
} 