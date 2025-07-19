/**
 * 模拟环境变量设置脚本
 * 
 * 此脚本用于在测试时模拟 API 密钥环境变量，避免使用真实的 API 密钥。
 * 使用方法：
 *   node -r ./mock-env.js <其他脚本>
 * 
 * 例如：
 *   node -r ./mock-env.js interactive-cli.js
 */

// 设置模拟的环境变量
process.env.OPENAI_API_KEY = 'sk-mock-openai-api-key-12345678901234567890';
process.env.ANTHROPIC_API_KEY = 'sk-mock-anthropic-api-key-12345678901234567890';
process.env.GEMINI_API_KEY = 'mock-gemini-api-key-12345678901234567890';

console.log('已设置模拟环境变量：');
console.log(`OPENAI_API_KEY: ${process.env.OPENAI_API_KEY.substring(0, 7)}...`);
console.log(`ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY.substring(0, 7)}...`);
console.log(`GEMINI_API_KEY: ${process.env.GEMINI_API_KEY.substring(0, 7)}...`); 