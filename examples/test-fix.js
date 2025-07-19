#!/usr/bin/env node

/**
 * LLMs Code 修复测试脚本
 * 
 * 此脚本用于测试我们对适配器系统的修复。
 * 使用方法：
 *   node -r ./mock-env.js test-fix.js
 */

import { AdapterManager, AdapterContentGenerator } from '../packages/core/dist/index.js';

// 测试适配器管理器
async function testAdapterManager() {
  console.log('=== 测试适配器管理器 ===');
  
  try {
    // 初始化适配器管理器
    const adapterManager = AdapterManager.getInstance();
    await adapterManager.initialize();
    
    // 获取可用模型
    const models = adapterManager.getAvailableModels();
    console.log(`可用模型: ${models.length}`);
    
    for (const model of models) {
      console.log(`- ${model.name} (${model.provider})`);
    }
    
    // 获取默认适配器
    const defaultAdapter = adapterManager.getDefaultAdapter();
    console.log(`默认适配器: ${defaultAdapter.getName()}`);
    
    return true;
  } catch (error) {
    console.error(`测试适配器管理器失败: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

// 测试适配器内容生成器
async function testAdapterContentGenerator() {
  console.log('\n=== 测试适配器内容生成器 ===');
  
  try {
    // 创建适配器内容生成器
    const generator = new AdapterContentGenerator();
    await generator.initialize();
    
    // 获取当前模型
    const currentModel = generator.getCurrentModel();
    console.log(`当前模型: ${currentModel}`);
    
    // 生成内容
    console.log('生成内容中...');
    const response = await generator.generateContent({
      contents: '你好，请用中文简短介绍一下自己。'
    });
    
    console.log('生成内容成功:');
    console.log(response.text);
    
    return true;
  } catch (error) {
    console.error(`测试适配器内容生成器失败: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

// 主函数
async function main() {
  console.log('LLMs Code 修复测试脚本');
  console.log('=====================\n');
  
  // 测试适配器管理器
  const adapterManagerResult = await testAdapterManager();
  
  // 测试适配器内容生成器
  const adapterContentGeneratorResult = await testAdapterContentGenerator();
  
  // 输出测试结果
  console.log('\n=== 测试结果 ===');
  console.log(`适配器管理器: ${adapterManagerResult ? '通过' : '失败'}`);
  console.log(`适配器内容生成器: ${adapterContentGeneratorResult ? '通过' : '失败'}`);
  
  if (adapterManagerResult && adapterContentGeneratorResult) {
    console.log('\n所有测试通过！');
  } else {
    console.log('\n测试失败！');
    process.exit(1);
  }
}

// 运行主函数
main().catch(error => {
  console.error(`测试失败: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}); 