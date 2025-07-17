/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseLLMAdapter } from './BaseLLMAdapter.js';
import { CompletionResponse, EmbeddingResponse, GenerationParams, Message, MessageRole, StreamResponse, LLMTool } from './LLMAdapter.js';
import { DEFAULT_GEMINI_MODEL, DEFAULT_GEMINI_EMBEDDING_MODEL } from '../config/models.js';

/**
 * Gemini适配器实现
 */
export class GeminiAdapter extends BaseLLMAdapter {
  // Gemini模型的最大上下文长度映射
  private static readonly MODEL_CONTEXT_LENGTHS: Record<string, number> = {
    'gemini-2.5-pro': 1000000,
    'gemini-2.5-flash': 1000000,
    'gemini-1.5-pro': 1000000,
    'gemini-1.5-flash': 1000000,
    'gemini-1.0-pro': 32768,
    'gemini-1.0-pro-vision': 32768
  };

  private genAI: any = null;
  private model: any = null;

  /**
   * 获取适配器名称
   */
  getName(): string {
    return 'Gemini';
  }

  /**
   * 获取适配器支持的模型列表
   */
  getSupportedModels(): string[] {
    return Object.keys(GeminiAdapter.MODEL_CONTEXT_LENGTHS);
  }

  /**
   * 初始化适配器
   * @param config 模型配置
   */
  async initialize(config: any): Promise<void> {
    await super.initialize(config);
    
    try {
      // 动态导入Google GenAI SDK
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      
      this.genAI = new GoogleGenerativeAI(this.config?.apiKey);
      this.model = this.genAI.getGenerativeModel({
        model: this.config?.name || DEFAULT_GEMINI_MODEL,
        apiVersion: this.config?.parameters?.apiVersion
      });
    } catch (error) {
      throw new Error(`初始化Gemini适配器失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 生成文本完成
   * @param params 生成参数
   */
  async generateCompletion(params: GenerationParams): Promise<CompletionResponse> {
    this.checkInitialized();
    
    try {
      const geminiMessages = this.convertToGeminiMessages(params.messages, params.systemPrompt);
      const tools = this.convertToGeminiTools(params.tools);
      
      const result = await this.model.generateContent({
        contents: geminiMessages,
        generationConfig: {
          temperature: params.temperature,
          maxOutputTokens: params.maxTokens,
          stopSequences: params.stopSequences
        },
        tools: tools
      });
      
      const response = result.response;
      
      return {
        text: response.text(),
        metadata: {
          usage: response.promptFeedback,
          model: this.config?.name || DEFAULT_GEMINI_MODEL
        }
      };
    } catch (error) {
      throw new Error(`Gemini生成失败: ${error instanceof Error ? error.message : String(error)}`);
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
      const geminiMessages = this.convertToGeminiMessages(params.messages, params.systemPrompt);
      const tools = this.convertToGeminiTools(params.tools);
      
      const result = await this.model.generateContentStream({
        contents: geminiMessages,
        generationConfig: {
          temperature: params.temperature,
          maxOutputTokens: params.maxTokens,
          stopSequences: params.stopSequences
        },
        tools: tools
      });
      
      for await (const chunk of result.stream) {
        const text = chunk.text();
        
        callback({
          text,
          isLast: false,
          metadata: {
            model: this.config?.name || DEFAULT_GEMINI_MODEL
          }
        });
      }
      
      // 最后一个块
      callback({
        text: '',
        isLast: true,
        metadata: {
          model: this.config?.name || DEFAULT_GEMINI_MODEL,
          promptFeedback: result.response.promptFeedback
        }
      });
    } catch (error) {
      throw new Error(`Gemini流式生成失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 生成嵌入向量
   * @param text 输入文本
   */
  async generateEmbedding(text: string): Promise<EmbeddingResponse> {
    this.checkInitialized();
    
    try {
      const embeddingModel = this.genAI.getGenerativeModel({
        model: DEFAULT_GEMINI_EMBEDDING_MODEL
      });
      
      const result = await embeddingModel.embedContent(text);
      const embedding = result.embedding.values;
      
      return {
        embedding,
        metadata: {
          model: DEFAULT_GEMINI_EMBEDDING_MODEL
        }
      };
    } catch (error) {
      throw new Error(`Gemini嵌入生成失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取模型的最大上下文长度
   */
  getMaxContextLength(): number {
    this.checkInitialized();
    const modelName = this.config?.name || DEFAULT_GEMINI_MODEL;
    return GeminiAdapter.MODEL_CONTEXT_LENGTHS[modelName] || 32768; // 默认值
  }

  /**
   * 检查API密钥是否有效
   */
  async validateApiKey(): Promise<boolean> {
    try {
      if (!this.initialized || !this.model) {
        await this.initialize(this.config!);
      }
      
      // 尝试发送一个简单的请求作为API密钥验证
      await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
        generationConfig: {
          maxOutputTokens: 1
        }
      });
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 将消息转换为Gemini格式
   * @param messages 消息列表
   * @param systemPrompt 系统提示
   */
  private convertToGeminiMessages(messages: Message[], systemPrompt?: string): any[] {
    const result: any[] = [];
    
    // 添加系统提示作为第一条用户消息
    if (systemPrompt) {
      result.push({
        role: 'user',
        parts: [{ text: systemPrompt }]
      });
      
      // 如果有系统提示，添加一个空的助手响应
      result.push({
        role: 'model',
        parts: [{ text: 'I understand.' }]
      });
    }
    
    // 转换消息
    for (const message of messages) {
      const geminiMessage: any = {
        role: this.convertRole(message.role),
        parts: [{ text: message.content }]
      };
      
      // 处理工具调用结果
      if (message.toolCallResults && message.toolCallResults.length > 0) {
        for (const toolResult of message.toolCallResults) {
          geminiMessage.parts.push({
            functionResponse: {
              name: toolResult.toolName,
              response: {
                name: toolResult.toolName,
                content: toolResult.result
              }
            }
          });
        }
      }
      
      result.push(geminiMessage);
    }
    
    return result;
  }

  /**
   * 将工具转换为Gemini格式
   * @param tools 工具列表
   */
  private convertToGeminiTools(tools?: LLMTool[]): any[] | undefined {
    if (!tools || tools.length === 0) {
      return undefined;
    }
    
    return [{
      functionDeclarations: tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }))
    }];
  }

  /**
   * 转换消息角色
   * @param role 消息角色
   */
  private convertRole(role: MessageRole): string {
    switch (role) {
      case MessageRole.SYSTEM:
        return 'user'; // Gemini没有系统角色，使用用户角色
      case MessageRole.USER:
        return 'user';
      case MessageRole.ASSISTANT:
        return 'model';
      case MessageRole.TOOL:
        return 'function';
      default:
        return 'user';
    }
  }
} 