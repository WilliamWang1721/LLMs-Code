/**
 * 修复构建错误的脚本
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🔧 开始修复构建错误...');

// 1. 修复GeminiAdapter中API密钥问题
const geminiAdapterPath = path.join('packages', 'core', 'src', 'adapters', 'GeminiAdapter.ts');
console.log(`修复文件: ${geminiAdapterPath}`);
let geminiAdapter = fs.readFileSync(geminiAdapterPath, 'utf8');
geminiAdapter = geminiAdapter.replace(
  /this\.genAI = new GoogleGenerativeAI\(this\.config\?\.apiKey\);/,
  `if (!this.config || !this.config.apiKey) {
      throw new Error('API密钥未设置');
    }
    this.genAI = new GoogleGenerativeAI(this.config.apiKey);`
);
fs.writeFileSync(geminiAdapterPath, geminiAdapter);

// 2. 修复SiliconFlowAdapter中的类似问题
const siliconFlowAdapterPath = path.join('packages', 'core', 'src', 'adapters', 'SiliconFlowAdapter.ts');
if (fs.existsSync(siliconFlowAdapterPath)) {
  console.log(`修复文件: ${siliconFlowAdapterPath}`);
  let siliconFlowAdapter = fs.readFileSync(siliconFlowAdapterPath, 'utf8');
  siliconFlowAdapter = siliconFlowAdapter.replace(
    /this\.api = this\.createSiliconFlowClient\(\s*this\.config\?\.apiKey,/,
    `if (!this.config || !this.config.apiKey) {
      throw new Error('API密钥未设置或格式不正确');
    }
    this.api = this.createSiliconFlowClient(
      this.config.apiKey,`
  );
  fs.writeFileSync(siliconFlowAdapterPath, siliconFlowAdapter);
}

// 3. 修复i18n导入路径
const llmsCodePath = path.join('packages', 'cli', 'src', 'llms-code.tsx');
console.log(`修复文件: ${llmsCodePath}`);
let llmsCode = fs.readFileSync(llmsCodePath, 'utf8');
llmsCode = llmsCode.replace(
  /import i18n from '\.\/i18n';/,
  "import i18n from './i18n.js';"
);

// 4. 修复函数调用参数
llmsCode = llmsCode.replace(
  /await runNonInteractive\(nonInteractiveConfig, question\);/,
  "await runNonInteractive(nonInteractiveConfig, question, 'cli_prompt');"
);
llmsCode = llmsCode.replace(
  /registerCleanup\(\);/,
  "registerCleanup(() => { console.log('Cleaning up...'); });"
);
fs.writeFileSync(llmsCodePath, llmsCode);

// 5. 替换Gradient组件
const components = [
  'Footer.tsx', 
  'Header.tsx', 
  'StatsDisplay.tsx'
];

for (const component of components) {
  const componentPath = path.join('packages', 'cli', 'src', 'ui', 'components', component);
  if (fs.existsSync(componentPath)) {
    console.log(`修复文件: ${componentPath}`);
    let content = fs.readFileSync(componentPath, 'utf8');
    
    // 删除Gradient导入
    content = content.replace(/import Gradient from 'ink-gradient';/, '');
    
    // 替换Gradient组件为Text组件
    content = content.replace(
      /<Gradient colors={Colors\.GradientColors}>([\s\S]*?)<\/Gradient>/g,
      '<Text color={Colors.AccentBlue}>$1</Text>'
    );
    
    fs.writeFileSync(componentPath, content);
  }
}

// 安装缺失的类型定义
console.log('安装缺失的类型定义...');
try {
  execSync('npm install --save-dev @types/command-exists @types/update-notifier @types/semver', { stdio: 'inherit' });
} catch (error) {
  console.error('安装类型定义失败:', error);
}

console.log('✅ 构建错误修复完成!');
console.log('现在尝试运行 npm run build');
