/**
 * 批量修改导入语句的脚本
 * 将 @google/gemini-cli-core 替换为 llms-code-core
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 获取所有包含 @google/gemini-cli-core 的文件
const output = execSync('grep -r "@google/gemini-cli-core" --include="*.ts" --include="*.tsx" packages/cli/src', { 
  cwd: __dirname, 
  encoding: 'utf8' 
});

const files = output
  .split('\n')
  .filter(Boolean)
  .map(line => {
    const parts = line.split(':');
    return parts[0];
  })
  .filter((value, index, self) => self.indexOf(value) === index); // 去重

console.log(`找到 ${files.length} 个文件需要修改`);

// 处理每个文件
files.forEach(file => {
  try {
    const filePath = join(__dirname, file);
    const content = readFileSync(filePath, 'utf8');
    
    // 替换导入语句
    const newContent = content.replace(/'@google\/gemini-cli-core'/g, "'llms-code-core'");
    
    // 写回文件
    writeFileSync(filePath, newContent, 'utf8');
    console.log(`✓ 已更新: ${file}`);
  } catch (error) {
    console.error(`× 处理 ${file} 时出错:`, error);
  }
});

console.log('导入语句替换完成!'); 