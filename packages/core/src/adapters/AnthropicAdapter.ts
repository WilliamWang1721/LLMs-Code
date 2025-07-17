/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseLLMAdapter } from './BaseLLMAdapter.js';
import { CompletionResponse, EmbeddingResponse, GenerationParams, Message, MessageRole, StreamResponse, LLMTool } from './LLMAdapter.js';
import { DEFAULT_CLAUDE_MODEL } from '../config/models.js';

/**
 * Anthropic适配器实现
 */
export class AnthropicAdapter extends BaseLLMAdapter {
  // Claude模型的最大上下文长度映射
  private static readonly MODEL_CONTEXT_LENGTHS: Record<string, number> = {
    'claude-3-opus': 200000,
    'claude-3-sonnet': 200000,
    'claude-3-haiku': 200000,
    'claude-2': 100000,
    'claude-instant': 100000
  };

  private anthropic: any = null;

  /**
   * 获取适配器名称
   */
  getName(): string {
    return 'Anthropic';
  }

  /**
   * 获取适配器支持的模型列表
   */
  getSupportedModels(): string[] {
    return Object.keys(AnthropicAdapter.MODEL_CONTEXT_LENGTHS);
  }

  /**
   * 初始化适配器
   * @param config 模型配置
   */
  async initialize(config: any): Promise<void> {
    await super.initialize(config);
    
    try {
      // 动态导入Anthropic SDK
      const { Anthropic } = await import('@anthropic-ai/sdk');
      
      this.anthropic = new Anthropic({
        apiKey: this.config?.apiKey,
        baseURL: this.config?.endpoint
      });
    } catch (error) {
      throw new Error(`初始化Anthropic适配器失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 生成文本完成
   * @param params 生成参数
   */
  async generateCompletion(params: GenerationParams): Promise<CompletionResponse> {
    this.checkInitialized();
    
    try {
      const anthropicMessages = this.convertToAnthropicMessages(params.messages);
      const tools = this.convertToAnthropicTools(params.tools);
      
      const response = await this.anthropic.messages.create({
        model: this.config?.name || DEFAULT_CLAUDE_MODEL,
        messages: anthropicMessages,
        system: params.systemPrompt,
        temperature: params.temperature,
        max_tokens: params.maxTokens,
        tools: tools,
        stop_sequences: params.stopSequences
      });
      
      return {
        text: response.content[0]?.text || '',
        metadata: {
          usage: response.usage,
          model: response.model
        }
      };
    } catch (error) {
      throw new Error(`Anthropic生成失败: ${error instanceof Error ? error.message : String(error)}`);
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
      const anthropicMessages = this.convertToAnthropicMessages(params.messages);
      const tools = this.convertToAnthropicTools(params.tools);
      
      const stream = await this.anthropic.messages.create({
        model: this.config?.name || DEFAULT_CLAUDE_MODEL,
        messages: anthropicMessages,
        system: params.systemPrompt,
        temperature: params.temperature,
        max_tokens: params.maxTokens,
        tools: tools,
        stop_sequences: params.stopSequences,
        stream: true
      });
      
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text') {
          const content = chunk.delta.text || '';
          
          callback({
            text: content,
            isLast: false,
            metadata: {
              model: chunk.model
            }
          });
        }
        
        if (chunk.type === 'message_stop') {
          callback({
            text: '',
            isLast: true,
            metadata: {
              model: chunk.model
            }
          });
        }
      }
    } catch (error) {
      throw new Error(`Anthropic流式生成失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 生成嵌入向量
   * @param text 输入文本
   */
  async generateEmbedding(text: string): Promise<EmbeddingResponse> {
    this.checkInitialized();
    
    try {
      // Claude目前不支持嵌入，但我们可以使用第三方库或API
      throw new Error('Anthropic Claude目前不支持嵌入生成');
    } catch (error) {
      throw new Error(`Anthropic嵌入生成失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取模型的最大上下文长度
   */
  getMaxContextLength(): number {
    this.checkInitialized();
    const modelName = this.config?.name || DEFAULT_CLAUDE_MODEL;
    return AnthropicAdapter.MODEL_CONTEXT_LENGTHS[modelName] || 100000; // 默认值
  }

  /**
   * 检查API密钥是否有效
   */
  async validateApiKey(): Promise<boolean> {
    try {
      if (!this.initialized || !this.anthropic) {
        await this.initialize(this.config!);
      }
      
      // 尝试发送一个简单的请求作为API密钥验证
      await this.anthropic.messages.create({
        model: this.config?.name || DEFAULT_CLAUDE_MODEL,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 1
      });
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 将消息转换为Anthropic格式
   * @param messages 消息列表
   */
  private convertToAnthropicMessages(messages: Message[]): any[] {
    const result: any[] = [];
    
    // 转换消息
    for (const message of messages) {
      // 跳过系统消息，因为Claude使用单独的system参数
      if (message.role === MessageRole.SYSTEM) {
        continue;
      }
      
      const anthropicMessage: any = {
        role: this.convertRole(message.role),
        content: message.content
      };
      
      // 处理工具调用结果
      if (message.toolCallResults && message.toolCallResults.length > 0) {
        anthropicMessage.content = [
          {
            type: 'text',
            text: message.content
          }
        ];
        
        // 添加工具调用结果
        for (const toolResult of message.toolCallResults) {
          anthropicMessage.content.push({
            type: 'tool_use',
            id: toolResult.toolCallId,
            name: toolResult.toolName,
            input: JSON.parse(toolResult.result)
          });
        }
      }
      
      result.push(anthropicMessage);
    }
    
    return result;
  }

  /**
   * 将工具转换为Anthropic格式
   * @param tools 工具列表
   */
  private convertToAnthropicTools(tools?: LLMTool[]): any[] | undefined {
    if (!tools || tools.length === 0) {
      return undefined;
    }
    
    return tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: {
        type: 'object',
        properties: tool.parameters.properties,
        required: tool.parameters.required
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