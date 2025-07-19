/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseLLMAdapter } from './BaseLLMAdapter.js';
import { CompletionResponse, EmbeddingResponse, GenerationParams, Message, MessageRole, StreamResponse, LLMTool } from './LLMAdapter.js';
import { DEFAULT_SILICON_FLOW_MODEL, DEFAULT_SILICON_FLOW_EMBEDDING_MODEL } from '../config/models.js';

// 定义SiliconFlowClient接口
interface SiliconFlowClient {
  chat: {
    completions: {
      create: (params: any) => Promise<any>;
    };
  };
  embeddings: {
    create: (params: any) => Promise<any>;
  };
  models: {
    list: () => Promise<any>;
  };
}

/**
 * Silicon Flow适配器实现
 */
export class SiliconFlowAdapter extends BaseLLMAdapter {
  // Silicon Flow模型的最大上下文长度映射
  private static readonly MODEL_CONTEXT_LENGTHS: Record<string, number> = {
    'silicon-pro': 128000,
    'silicon-flash': 64000,
    'silicon-embedding-001': 8191
  };

  private api: SiliconFlowClient | null = null;

  /**
   * 获取适配器名称
   */
  getName(): string {
    return 'SiliconFlow';
  }

  /**
   * 获取适配器支持的模型列表
   */
  getSupportedModels(): string[] {
    return Object.keys(SiliconFlowAdapter.MODEL_CONTEXT_LENGTHS);
  }

  /**
   * 初始化适配器
   * @param config 模型配置
   */
  async initialize(config: any): Promise<void> {
    await super.initialize(config);
    
    try {
      // 动态导入Silicon Flow SDK
      // 注意：这里假设存在silicon-flow模块，实际使用时需要安装或实现此模块
      // const { SiliconFlowClient } = await import('silicon-flow');
      
      if (!this.config?.apiKey) {
        throw new Error('API密钥未设置');
      }
      
      // 临时实现，使用fetch直接调用API
      this.api = this.createSiliconFlowClient(
        this.config.apiKey,
        this.config?.endpoint || 'https://api.siliconflow.com/v1'
      );
    } catch (error) {
      throw new Error(`初始化SiliconFlow适配器失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 创建Silicon Flow客户端
   * @param apiKey API密钥
   * @param baseURL API基础URL
   */
  private createSiliconFlowClient(apiKey: string, baseURL: string): SiliconFlowClient {
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };

    return {
      chat: {
        completions: {
          create: async (params: any) => {
            const isStream = params.stream;
            if (isStream) {
              const response = await fetch(`${baseURL}/chat/completions`, {
                method: 'POST',
                headers,
                body: JSON.stringify(params),
              });
              return response.body;
            } else {
              const response = await fetch(`${baseURL}/chat/completions`, {
                method: 'POST',
                headers,
                body: JSON.stringify(params),
              });
              return await response.json();
            }
          }
        }
      },
      embeddings: {
        create: async (params: any) => {
          const response = await fetch(`${baseURL}/embeddings`, {
            method: 'POST',
            headers,
            body: JSON.stringify(params),
          });
          return await response.json();
        }
      },
      models: {
        list: async () => {
          const response = await fetch(`${baseURL}/models`, {
            method: 'GET',
            headers,
          });
          return await response.json();
        }
      }
    };
  }

  /**
   * 生成文本完成
   * @param params 生成参数
   */
  async generateCompletion(params: GenerationParams): Promise<CompletionResponse> {
    this.checkInitialized();
    
    try {
      const messages = this.convertToSiliconFlowMessages(params.messages, params.systemPrompt);
      const tools = this.convertToSiliconFlowTools(params.tools);
      
      const response = await this.api!.chat.completions.create({
        model: this.config?.name || DEFAULT_SILICON_FLOW_MODEL,
        messages: messages,
        temperature: params.temperature,
        max_tokens: params.maxTokens,
        tools: tools,
        stop_sequences: params.stopSequences
      });
      
      return {
        text: response.choices[0]?.message?.content || '',
        metadata: {
          usage: response.usage,
          model: this.config?.name || DEFAULT_SILICON_FLOW_MODEL
        }
      };
    } catch (error) {
      throw new Error(`Silicon Flow生成失败: ${error instanceof Error ? error.message : String(error)}`);
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
      const messages = this.convertToSiliconFlowMessages(params.messages, params.systemPrompt);
      const tools = this.convertToSiliconFlowTools(params.tools);
      
      const stream = await this.api!.chat.completions.create({
        model: this.config?.name || DEFAULT_SILICON_FLOW_MODEL,
        messages: messages,
        temperature: params.temperature,
        max_tokens: params.maxTokens,
        tools: tools,
        stop_sequences: params.stopSequences,
        stream: true
      });
      
      // 假设stream是可读流
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        // 解析SSE格式
        const data = chunk.split('\n').filter(line => line.startsWith('data: ')).map(line => {
          try {
            return JSON.parse(line.slice(6));
          } catch (e) {
            return null;
          }
        }).filter(Boolean)[0];
        
        if (data && data.choices && data.choices[0]?.delta?.content) {
          callback({
            text: data.choices[0].delta.content,
            isLast: false,
            metadata: {
              model: this.config?.name || DEFAULT_SILICON_FLOW_MODEL
            }
          });
        }
      }
      
      // 最后一个块
      callback({
        text: '',
        isLast: true,
        metadata: {
          model: this.config?.name || DEFAULT_SILICON_FLOW_MODEL,
        }
      });
    } catch (error) {
      throw new Error(`Silicon Flow流式生成失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 生成嵌入向量
   * @param text 输入文本
   */
  async generateEmbedding(text: string): Promise<EmbeddingResponse> {
    this.checkInitialized();
    
    try {
      const response = await this.api!.embeddings.create({
        model: DEFAULT_SILICON_FLOW_EMBEDDING_MODEL,
        input: text
      });
      
      return {
        embedding: response.data[0].embedding,
        metadata: {
          model: DEFAULT_SILICON_FLOW_EMBEDDING_MODEL
        }
      };
    } catch (error) {
      throw new Error(`Silicon Flow嵌入生成失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取模型的最大上下文长度
   */
  getMaxContextLength(): number {
    this.checkInitialized();
    const modelName = this.config?.name || DEFAULT_SILICON_FLOW_MODEL;
    return SiliconFlowAdapter.MODEL_CONTEXT_LENGTHS[modelName] || 64000; // 默认值
  }

  /**
   * 检查API密钥是否有效
   */
  async validateApiKey(): Promise<boolean> {
    try {
      if (!this.initialized || !this.api) {
        await this.initialize(this.config!);
      }
      
      // 尝试发送一个简单的请求作为API密钥验证
      await this.api!.models.list();
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 将消息转换为Silicon Flow格式
   * @param messages 消息列表
   * @param systemPrompt 系统提示
   */
  private convertToSiliconFlowMessages(messages: Message[], systemPrompt?: string): any[] {
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
      const siliconFlowMessage: any = {
        role: this.convertRole(message.role),
        content: message.content
      };
      
      // 处理工具调用结果
      if (message.toolCallResults && message.toolCallResults.length > 0) {
        siliconFlowMessage.tool_calls = message.toolCallResults.map(toolResult => ({
          id: toolResult.toolCallId || `tool_call_${Date.now()}`,
          type: 'function',
          function: {
            name: toolResult.toolName,
            arguments: JSON.stringify(toolResult.result)
          }
        }));
      }
      
      result.push(siliconFlowMessage);
    }
    
    return result;
  }

  /**
   * 将工具定义转换为Silicon Flow格式
   * @param tools 工具定义
   */
  private convertToSiliconFlowTools(tools?: LLMTool[]): any[] | undefined {
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
   * @param role 角色
   */
  private convertRole(role: MessageRole): string {
    switch (role) {
      case MessageRole.USER:
        return 'user';
      case MessageRole.ASSISTANT:
        return 'assistant';
      case MessageRole.SYSTEM:
        return 'system';
      default:
        return 'user';
    }
  }
} 