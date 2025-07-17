/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'ink';
import './i18n'; // Import i18n configuration
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
import { AppWrapper } from './ui/App.js';
import { loadCliConfig, parseArguments, CliArgs } from './config/config.js';
import { readStdin } from './utils/readStdin.js';
import { basename } from 'node:path';
import v8 from 'node:v8';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { start_sandbox } from './utils/sandbox.js';
import {
  LoadedSettings,
  loadSettings,
  USER_SETTINGS_PATH,
  SettingScope,
} from './config/settings.js';
import { themeManager } from './ui/themes/theme-manager.js';
import { getStartupWarnings } from './utils/startupWarnings.js';
import { getUserStartupWarnings } from './utils/userStartupWarnings.js';
import { runNonInteractive } from './nonInteractiveCli.js';
import { loadExtensions, Extension } from './config/extension.js';
import { cleanupCheckpoints, registerCleanup } from './utils/cleanup.js';
import { getCliVersion } from './utils/version.js';
import {
  ApprovalMode,
  Config,
  EditTool,
  ShellTool,
  WriteFileTool,
  sessionId,
  logUserPrompt,
  AuthType,
  getOauthClient,
} from '@google/gemini-cli-core';
import { validateAuthMethod } from './config/auth.js';
import { setMaxSizedBoxDebugging } from './ui/components/shared/MaxSizedBox.js';

function getNodeMemoryArgs(config: Config): string[] {
  const totalMemoryMB = os.totalmem() / (1024 * 1024);
  const heapStats = v8.getHeapStatistics();
  const currentMaxOldSpaceSizeMb = Math.floor(
    heapStats.heap_size_limit / 1024 / 1024,
  );

  // Set target to 50% of total memory
  const targetMaxOldSpaceSizeInMB = Math.floor(totalMemoryMB * 0.5);
  if (config.getDebugMode()) {
    console.debug(
      `Current heap size ${currentMaxOldSpaceSizeMb.toFixed(2)} MB`,
    );
  }

  if (process.env.LLMS_CODE_CLI_NO_RELAUNCH) {
    return [];
  }

  if (targetMaxOldSpaceSizeInMB > currentMaxOldSpaceSizeMb) {
    if (config.getDebugMode()) {
      console.debug(
        `Need to relaunch with more memory: ${targetMaxOldSpaceSizeInMB.toFixed(2)} MB`,
      );
    }
    return [`--max-old-space-size=${targetMaxOldSpaceSizeInMB}`];
  }

  return [];
}

async function relaunchWithAdditionalArgs(additionalArgs: string[]) {
  const nodeArgs = [...additionalArgs, ...process.argv.slice(1)];
  const newEnv = { ...process.env, LLMS_CODE_CLI_NO_RELAUNCH: 'true' };

  const child = spawn(process.execPath, nodeArgs, {
    stdio: 'inherit',
    env: newEnv,
  });

  await new Promise((resolve) => child.on('close', resolve));
  process.exit(0);
}

export async function main() {
  const workspaceRoot = process.cwd();
  const settings = loadSettings(workspaceRoot);

  await cleanupCheckpoints();
  if (settings.errors.length > 0) {
    for (const error of settings.errors) {
      let errorMessage = `Error in ${error.path}: ${error.message}`;
      if (!process.env.NO_COLOR) {
        errorMessage = `\x1b[31m${errorMessage}\x1b[0m`;
      }
      console.error(errorMessage);
      console.error(`Please fix ${error.path} and try again.`);
    }
    process.exit(1);
  }

  const argv = await parseArguments();
  const extensions = loadExtensions(workspaceRoot);
  const config = await loadCliConfig(
    settings.merged,
    extensions,
    sessionId,
    argv,
  );

  if (argv.promptInteractive && !process.stdin.isTTY) {
    console.error(
      'Error: The --prompt-interactive flag is not supported when piping input from stdin.',
    );
    process.exit(1);
  }

  if (config.getListExtensions()) {
    console.log('Installed extensions:');
    for (const extension of extensions) {
      console.log(`- ${extension.config.name}`);
    }
    process.exit(0);
  }

  // Set a default auth type if one isn't set.
  if (!settings.merged.selectedAuthType) {
    if (process.env.CLOUD_SHELL === 'true') {
      settings.setValue(
        SettingScope.User,
        'selectedAuthType',
        AuthType.CLOUD_SHELL,
      );
    }
  }

  // 隐藏开始界面的提示信息
  settings.setValue(
    SettingScope.User,
    'hideTips',
    'true'
  );

  setMaxSizedBoxDebugging(config.getDebugMode());

  await config.initialize();

  if (settings.merged.theme) {
    if (!themeManager.setActiveTheme(settings.merged.theme)) {
      // If the theme is not found during initial load, log a warning and continue.
      // The useThemeCommand hook in App.tsx will handle opening the dialog.
      console.warn(`Warning: Theme "${settings.merged.theme}" not found.`);
    }
  }

  // hop into sandbox if we are outside and sandboxing is enabled
  if (!process.env.SANDBOX) {
    const memoryArgs = settings.merged.autoConfigureMaxOldSpaceSize
      ? getNodeMemoryArgs(config)
      : [];
    const sandboxConfig = config.getSandbox();
    if (sandboxConfig) {
      if (settings.merged.selectedAuthType) {
        // Validate authentication here because the sandbox will interfere with the Oauth2 web redirect.
        try {
          const err = validateAuthMethod(settings.merged.selectedAuthType);
          if (err) {
            throw new Error(err);
          }
          await config.refreshAuth(settings.merged.selectedAuthType);
        } catch (err) {
          console.error('Error authenticating:', err);
          process.exit(1);
        }
      }
      await start_sandbox(sandboxConfig, memoryArgs);
      process.exit(0);
    } else {
      // Not in a sandbox and not entering one, so relaunch with additional
      // arguments to control memory usage if needed.
      if (memoryArgs.length > 0) {
        await relaunchWithAdditionalArgs(memoryArgs);
        process.exit(0);
      }
    }
  }

  if (
    settings.merged.selectedAuthType === AuthType.LOGIN_WITH_GOOGLE &&
    config.getNoBrowser()
  ) {
    // Do oauth before app renders to make copying the link possible.
    await getOauthClient(settings.merged.selectedAuthType, config);
  }

  // If we have a question from the command line, run in non-interactive mode.
  if (config.getQuestion() !== undefined || !process.stdin.isTTY) {
    const nonInteractiveConfig = await loadNonInteractiveConfig(
      config,
      extensions,
      settings,
      argv,
    );

    try {
      await validateNonInterActiveAuth(
        settings.merged.selectedAuthType,
        nonInteractiveConfig,
      );
    } catch (err) {
      console.error('Error authenticating:', err);
      process.exit(1);
    }

    // If we're reading from stdin, read it now.
    let question = config.getQuestion();
    if (question === undefined && !process.stdin.isTTY) {
      question = await readStdin();
    }

    if (question === undefined || question.trim() === '') {
      console.error('Error: No question provided.');
      process.exit(1);
    }

    await runNonInteractive(nonInteractiveConfig, question);
    process.exit(0);
  }

  // Set window title
  await setWindowTitle('', settings, t);

  // Register cleanup handler for checkpoints
  registerCleanup();

  // 获取CLI版本
  const version = await getCliVersion();

  // Render the app
  render(
    <AppWrapper
      config={config}
      settings={settings}
      startupWarnings={await getStartupWarnings()}
      version={version}
    />,
  );
}

async function setWindowTitle(title: string, settings: LoadedSettings, t: (key: string) => string) {
  if (settings.merged.hideWindowTitle) {
    return;
  }

  if (process.stdout.isTTY) {
    try {
      const version = await getCliVersion();
      const windowTitle = title
        ? t('windowTitle', { title })
        : `LLMs Code v${version}`;
      process.stdout.write(`\x1b]0;${windowTitle}\x07`);
    } catch (error) {
      // 如果获取版本失败，使用无版本的标题
      const windowTitle = title
        ? t('windowTitle', { title })
        : 'LLMs Code';
      process.stdout.write(`\x1b]0;${windowTitle}\x07`);
    }
  }
}

async function loadNonInteractiveConfig(
  config: Config,
  extensions: Extension[],
  settings: LoadedSettings,
  argv: CliArgs,
) {
  // For non-interactive mode, we need to set the approval mode to auto-edit.
  // This is because we don't want to prompt the user for approval in non-interactive mode.
  // We also need to set the full context flag to true, so that we get the full context.
  // This is because we don't want to truncate the context in non-interactive mode.
  // We also need to set the debug mode to false, because we don't want to show debug output.
  // We also need to set the show memory usage flag to false, because we don't want to show memory usage.
  // We also need to set the checkpointing flag to false, because we don't want to checkpoint in non-interactive mode.
  const nonInteractiveSettings = {
    ...settings.merged,
    approvalMode: ApprovalMode.AUTO_EDIT,
    fullContext: true,
    debugMode: false,
    showMemoryUsage: false,
    checkpointing: false,
  };

  // Override with command line arguments.
  const nonInteractiveCliArgs = {
    ...argv,
    approvalMode: ApprovalMode.AUTO_EDIT,
    fullContext: true,
    debug: false,
    showMemoryUsage: false,
    checkpointing: false,
  };

  return await loadCliConfig(
    nonInteractiveSettings,
    extensions,
    sessionId,
    nonInteractiveCliArgs,
  );
}

async function validateNonInterActiveAuth(
  selectedAuthType: AuthType | undefined,
  nonInteractiveConfig: Config,
) {
  if (selectedAuthType) {
    // Validate authentication here because the sandbox will interfere with the Oauth2 web redirect.
    const err = validateAuthMethod(selectedAuthType);
    if (err) {
      throw new Error(err);
    }
    await nonInteractiveConfig.refreshAuth(selectedAuthType);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
} 