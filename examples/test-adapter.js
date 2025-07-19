#!/usr/bin/env node

/**
 * LLMs Code 适配器测试脚本
 * 
 * 此脚本用于测试 LLMs Code 的适配器实现，可以使用不同的模型生成内容。
 * 使用方法：
 *   node test-adapter.js [模型名称]
 * 
 * 示例：
 *   node test-adapter.js gpt-4o
 *   node test-adapter.js claude-3-opus
 *   node test-adapter.js gemini-1.5-pro
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AdapterManager, AdapterContentGenerator } from '../packages/core/dist/index.js';

// 获取当前脚本所在目录
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  try {
    // 获取命令行参数
    const modelName = process.argv[2] || 'gpt-4o';
    console.log(`使用模型: ${modelName}`);
    
    // 初始化适配器管理器
    const adapterManager = AdapterManager.getInstance();
    await adapterManager.initialize();
    
    // 创建内容生成器
    const generator = new AdapterContentGenerator(modelName);
    await generator.initialize();
    
    // 生成内容
    console.log('正在生成内容...');
    const response = await generator.generateContent({
      model: modelName,
      contents: '请用中文介绍一下你自己，并说明你支持哪些模型。',
    });
    
    // 输出结果
    console.log('\n生成结果:');
    console.log('------------------------');
    console.log(response.text);
    console.log('------------------------');
    
    console.log('\n测试完成!');
  } catch (error) {
    console.error('测试失败:', error);
    process.exit(1);
  }
}

main(); 