#!/usr/bin/env node

/**
 * LLMs Code CLI Entry Point
 * 
 * This script serves as the main entry point for the LLMs Code CLI tool.
 * When installed globally via npm, users can simply type 'llms-code' to start the program.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import fs from 'fs';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Path to the package.json file
const packageJsonPath = path.resolve(__dirname, '../package.json');

// Handle version flag
if (process.argv.includes('--version') || process.argv.includes('-v')) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    console.log(`LLMs Code v${packageJson.version}`);
    process.exit(0);
  } catch (error) {
    console.error('Error reading version information:', error.message);
    process.exit(1);
  }
}

// Path to the improved CLI script
const cliPath = path.resolve(__dirname, '../examples/improved-cli.js');

// Check if the CLI script exists
if (!fs.existsSync(cliPath)) {
  console.error(`Error: CLI script not found at ${cliPath}`);
  process.exit(1);
}

// Spawn the improved CLI process with all arguments passed through
try {
  const child = spawn('node', [cliPath, ...process.argv.slice(2)], {
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  // Handle process exit
  child.on('close', (code) => {
    process.exit(code);
  });

  // Handle errors
  child.on('error', (err) => {
    console.error(`Failed to start LLMs Code: ${err.message}`);
    process.exit(1);
  });
} catch (error) {
  console.error(`Error launching LLMs Code: ${error.message}`);
  process.exit(1);
} 