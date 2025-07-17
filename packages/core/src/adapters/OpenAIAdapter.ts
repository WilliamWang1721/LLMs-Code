/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseLLMAdapter } from './BaseLLMAdapter.js';
import { CompletionResponse, EmbeddingResponse, GenerationParams, Message, MessageRole, StreamResponse, LLMTool } from './LLMAdapter.js';
import { DEFAULT_OPENAI_MODEL, DEFAULT_OPENAI_EMBEDDING_MODEL } from '../config/models.js';

/**
 * OpenAI适配器实现
 */
export class OpenAIAdapter extends BaseLLMAdapter {
  // OpenAI模型的最大上下文长度映射
  private static readonly MODEL_CONTEXT_LENGTHS: Record<string, number> = {
    'gpt-4o': 128000,
    'gpt-4-turbo': 128000,
    'gpt-4': 8192,
    'gpt-3.5-turbo': 16385,
    'text-embedding-3-large': 8191,
    'text-embedding-3-small': 8191
  };

  private openai: any = null;

  /**
   * 获取适配器名称
   */
  getName(): string {
    return 'OpenAI';
  }

  /**
   * 获取适配器支持的模型列表
   */
  getSupportedModels(): string[] {
    return Object.keys(OpenAIAdapter.MODEL_CONTEXT_LENGTHS);
  }

  /**
   * 初始化适配器
   * @param config 模型配置
   */
  async initialize(config: any): Promise<void> {
    await super.initialize(config);
    
    try {
      // 动态导入OpenAI SDK
      const { OpenAI } = await import('openai');
      
      this.openai = new OpenAI({
        apiKey: this.config?.apiKey,
        baseURL: this.config?.endpoint
      });
    } catch (error) {
      throw new Error(`初始化OpenAI适配器失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 生成文本完成
   * @param params 生成参数
   */
  async generateCompletion(params: GenerationParams): Promise<CompletionResponse> {
    this.checkInitialized();
    
    try {
      const openaiMessages = this.convertToOpenAIMessages(params.messages, params.systemPrompt);
      const tools = this.convertToOpenAITools(params.tools);
      
      const response = await this.openai.chat.completions.create({
        model: this.config?.name || DEFAULT_OPENAI_MODEL,
        messages: openaiMessages,
        temperature: params.temperature,
        max_tokens: params.maxTokens,
        tools: tools,
        stop: params.stopSequences
      });
      
      return {
        text: response.choices[0]?.message?.content || '',
        metadata: {
          usage: response.usage,
          model: response.model
        }
      };
    } catch (error) {
      throw new Error(`OpenAI生成失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 流式生成文本
   * @param params 生成参数
   * @param callback 流式回调函数
   */
  async generateCompletionStream(
    params: GenerationParams,
    callback: (response: StreamResponse) => void
  ): Promise<void> {
    this.checkInitialized();
    
    try {
      const openaiMessages = this.convertToOpenAIMessages(params.messages, params.systemPrompt);
      const tools = this.convertToOpenAITools(params.tools);
      
      const stream = await this.openai.chat.completions.create({
        model: this.config?.name || DEFAULT_OPENAI_MODEL,
        messages: openaiMessages,
        temperature: params.temperature,
        max_tokens: params.maxTokens,
        tools: tools,
        stop: params.stopSequences,
        stream: true
      });
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        const isLast = chunk.choices[0]?.finish_reason != null;
        
        callback({
          text: content,
          isLast,
          metadata: {
            model: chunk.model
          }
        });
        
        if (isLast) break;
      }
    } catch (error) {
      throw new Error(`OpenAI流式生成失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 生成嵌入向量
   * @param text 输入文本
   */
  async generateEmbedding(text: string): Promise<EmbeddingResponse> {
    this.checkInitialized();
    
    try {
      const response = await this.openai.embeddings.create({
        model: DEFAULT_OPENAI_EMBEDDING_MODEL,
        input: text
      });
      
      return {
        embedding: response.data[0].embedding,
        metadata: {
          usage: response.usage,
          model: response.model
        }
      };
    } catch (error) {
      throw new Error(`OpenAI嵌入生成失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取模型的最大上下文长度
   */
  getMaxContextLength(): number {
    this.checkInitialized();
    const modelName = this.config?.name || DEFAULT_OPENAI_MODEL;
    return OpenAIAdapter.MODEL_CONTEXT_LENGTHS[modelName] || 8192; // 默认值
  }

  /**
   * 检查API密钥是否有效
   */
  async validateApiKey(): Promise<boolean> {
    try {
      if (!this.initialized || !this.openai) {
        await this.initialize(this.config!);
      }
      
      // 尝试列出模型作为API密钥验证
      await this.openai.models.list();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 将消息转换为OpenAI格式
   * @param messages 消息列表
   * @param systemPrompt 系统提示
   */
  private convertToOpenAIMessages(messages: Message[], systemPrompt?: string): any[] {
    const result: any[] = [];
    
    // 添加系统提示
    if (systemPrompt) {
      result.push({
        role: 'system',
        content: systemPrompt
      });
    }
    
    // 转换消息
    for (const message of messages) {
      const openaiMessage: any = {
        role: this.convertRole(message.role),
        content: message.content
      };
      
      if (message.name) {
        openaiMessage.name = message.name;
      }
      
      // 处理工具调用结果
      if (message.toolCallResults && message.toolCallResults.length > 0) {
        openaiMessage.tool_call_id = message.toolCallResults[0].toolCallId;
      }
      
      result.push(openaiMessage);
    }
    
    return result;
  }

  /**
   * 将工具转换为OpenAI格式
   * @param tools 工具列表
   */
  private convertToOpenAITools(tools?: LLMTool[]): any[] | undefined {
    if (!tools || tools.length === 0) {
      return undefined;
    }
    
    return tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }
    }));
  }

  /**
   * 转换消息角色
   * @param role 消息角色
   */
  private convertRole(role: MessageRole): string {
    switch (role) {
      case MessageRole.SYSTEM:
        return 'system';
      case MessageRole.USER:
        return 'user';
      case MessageRole.ASSISTANT:
        return 'assistant';
      case MessageRole.TOOL:
        return 'tool';
      default:
        return 'user';
    }
  }
} 