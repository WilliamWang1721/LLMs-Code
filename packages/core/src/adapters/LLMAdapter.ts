/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * 模型提供商类型
 */
export enum ModelProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GEMINI = 'gemini',
}

/**
 * 模型配置接口
 */
export interface ModelConfig {
  /** 模型名称 */
  name: string;
  /** 模型提供商 */
  provider: ModelProvider;
  /** API密钥，可以是直接的密钥或环境变量引用 (env:VAR_NAME) */
  apiKey: string;
  /** 可选的API端点 */
  endpoint?: string;
  /** 可选的模型参数 */
  parameters?: Record<string, any>;
}

/**
 * 流式响应接口
 */
export interface StreamResponse {
  /** 当前块的文本内容 */
  text: string;
  /** 是否是最后一个块 */
  isLast: boolean;
  /** 可选的元数据 */
  metadata?: Record<string, any>;
}

/**
 * 完整响应接口
 */
export interface CompletionResponse {
  /** 完整的响应文本 */
  text: string;
  /** 可选的元数据 */
  metadata?: Record<string, any>;
}

/**
 * 嵌入向量响应接口
 */
export interface EmbeddingResponse {
  /** 嵌入向量 */
  embedding: number[];
  /** 可选的元数据 */
  metadata?: Record<string, any>;
}

/**
 * 消息类型枚举
 */
export enum MessageRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
  TOOL = 'tool',
}

/**
 * 消息接口
 */
export interface Message {
  /** 消息角色 */
  role: MessageRole;
  /** 消息内容 */
  content: string;
  /** 可选的消息名称 */
  name?: string;
  /** 可选的工具调用结果 */
  toolCallResults?: ToolCallResult[];
}

/**
 * 工具调用结果接口
 */
export interface ToolCallResult {
  /** 工具名称 */
  toolName: string;
  /** 工具调用ID */
  toolCallId: string;
  /** 工具调用结果 */
  result: string;
}

/**
 * 工具定义接口
 */
export interface LLMTool {
  /** 工具类型 */
  type: string;
  /** 工具名称 */
  name: string;
  /** 工具描述 */
  description: string;
  /** 工具参数定义 */
  parameters: Record<string, any>;
}

/**
 * 生成参数接口
 */
export interface GenerationParams {
  /** 消息历史 */
  messages: Message[];
  /** 可选的系统提示 */
  systemPrompt?: string;
  /** 可选的工具列表 */
  tools?: LLMTool[];
  /** 可选的温度参数 */
  temperature?: number;
  /** 可选的最大标记数 */
  maxTokens?: number;
  /** 可选的停止序列 */
  stopSequences?: string[];
  /** 可选的其他参数 */
  [key: string]: any;
}

/**
 * LLM适配器接口
 * 作为所有模型通信的契约
 */
export interface LLMAdapter {
  /**
   * 获取适配器名称
   */
  getName(): string;

  /**
   * 获取适配器支持的模型列表
   */
  getSupportedModels(): string[];

  /**
   * 初始化适配器
   * @param config 模型配置
   */
  initialize(config: ModelConfig): Promise<void>;

  /**
   * 生成文本完成
   * @param params 生成参数
   */
  generateCompletion(params: GenerationParams): Promise<CompletionResponse>;

  /**
   * 流式生成文本
   * @param params 生成参数
   * @param callback 流式回调函数
   */
  generateCompletionStream(
    params: GenerationParams,
    callback: (response: StreamResponse) => void
  ): Promise<void>;

  /**
   * 生成嵌入向量
   * @param text 输入文本
   */
  generateEmbedding(text: string): Promise<EmbeddingResponse>;

  /**
   * 获取模型的最大上下文长度
   */
  getMaxContextLength(): number;

  /**
   * 获取模型的当前配置
   */
  getConfig(): ModelConfig;

  /**
   * 检查API密钥是否有效
   */
  validateApiKey(): Promise<boolean>;
}

/**
 * LLM适配器工厂接口
 */
export interface LLMAdapterFactory {
  /**
   * 创建适配器实例
   * @param provider 模型提供商
   */
  createAdapter(provider: ModelProvider): LLMAdapter;
} 