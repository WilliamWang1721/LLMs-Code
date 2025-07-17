/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { Colors } from '../colors.js';
import { RadioButtonSelect } from './shared/RadioButtonSelect.js';
import { LoadedSettings, SettingScope } from '../../config/settings.js';
import { AuthType } from '@google/gemini-cli-core';
import { validateAuthMethod } from '../../config/auth.js';

interface AuthDialogProps {
  onSelect: (authMethod: AuthType | undefined, scope: SettingScope) => void;
  settings: LoadedSettings;
  initialErrorMessage?: string | null;
}

function parseDefaultAuthType(
  defaultAuthType: string | undefined,
): AuthType | null {
  if (
    defaultAuthType &&
    Object.values(AuthType).includes(defaultAuthType as AuthType)
  ) {
    return defaultAuthType as AuthType;
  }
  return null;
}

interface PureAuthDialogProps extends AuthDialogProps {
  t: (key: string) => string;
}

export function PureAuthDialog({
  onSelect,
  settings,
  initialErrorMessage,
  t,
}: PureAuthDialogProps): React.JSX.Element {
  const [errorMessage, setErrorMessage] = useState<string | null>(() => {
    if (initialErrorMessage) {
      return initialErrorMessage;
    }

    const defaultAuthType = parseDefaultAuthType(
      process.env.GEMINI_DEFAULT_AUTH_TYPE,
    );

    if (process.env.GEMINI_DEFAULT_AUTH_TYPE && defaultAuthType === null) {
      return (
        `Invalid value for GEMINI_DEFAULT_AUTH_TYPE: "${process.env.GEMINI_DEFAULT_AUTH_TYPE}". ` +
        `Valid values are: ${Object.values(AuthType).join(', ')}.`
      );
    }

    if (
      process.env.GEMINI_API_KEY &&
      (!defaultAuthType || defaultAuthType === AuthType.USE_GEMINI)
    ) {
      return t('existingApiKey');
    }
    return null;
  });
  const items = [
    {
      label: t('loginWithGoogle'),
      value: AuthType.LOGIN_WITH_GOOGLE,
    },
    ...(process.env.CLOUD_SHELL === 'true'
      ? [
          {
            label: t('useCloudShell'),
            value: AuthType.CLOUD_SHELL,
          },
        ]
      : []),
    {
      label: t('useGeminiApiKey'),
      value: AuthType.USE_GEMINI,
    },
    { label: t('useVertexAi'), value: AuthType.USE_VERTEX_AI },
  ];

  const initialAuthIndex = items.findIndex((item) => {
    if (settings.merged.selectedAuthType) {
      return item.value === settings.merged.selectedAuthType;
    }

    const defaultAuthType = parseDefaultAuthType(
      process.env.GEMINI_DEFAULT_AUTH_TYPE,
    );
    if (defaultAuthType) {
      return item.value === defaultAuthType;
    }

    if (process.env.GEMINI_API_KEY) {
      return item.value === AuthType.USE_GEMINI;
    }

    return item.value === AuthType.LOGIN_WITH_GOOGLE;
  });

  const handleAuthSelect = (authMethod: AuthType) => {
    const error = validateAuthMethod(authMethod);
    if (error) {
      setErrorMessage(error);
    } else {
      setErrorMessage(null);
      onSelect(authMethod, SettingScope.User);
    }
  };

  useInput((_input, key) => {
    if (key.escape) {
      // Prevent exit if there is an error message.
      // This means they user is not authenticated yet.
      if (errorMessage) {
        return;
      }
      if (settings.merged.selectedAuthType === undefined) {
        // Prevent exiting if no auth method is set
        setErrorMessage(t('mustSelectAuthMethod'));
        return;
      }
      onSelect(undefined, SettingScope.User);
    }
  });

  return (
    <Box
      borderStyle="round"
      borderColor={Colors.Gray}
      flexDirection="column"
      padding={1}
      width="100%"
    >
      <Text bold>{t('getStarted')}</Text>
      <Box marginTop={1}>
        <Text>{t('howToAuthenticate')}</Text>
      </Box>
      <Box marginTop={1}>
        <RadioButtonSelect
          items={items}
          initialIndex={initialAuthIndex}
          onSelect={handleAuthSelect}
          isFocused={true}
        />
      </Box>
      {errorMessage && (
        <Box marginTop={1}>
          <Text color={Colors.AccentRed}>{errorMessage}</Text>
        </Box>
      )}
      <Box marginTop={1}>
        <Text color={Colors.Gray}>{t('pressEnterToSelect')}</Text>
      </Box>
      <Box marginTop={1}>
        <Text>{t('tosPrivacy')}</Text>
      </Box>
      <Box marginTop={1}>
        <Text color={Colors.AccentBlue}>{t('tosPrivacyLink')}</Text>
      </Box>
    </Box>
  );
}

export function AuthDialog(props: AuthDialogProps): React.JSX.Element {
  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      en: {
        existingApiKey:
          'Existing API key detected (GEMINI_API_KEY). Select "Gemini API Key" option to use it.',
        loginWithGoogle: 'Login with Google',
        useCloudShell: 'Use Cloud Shell credentials',
        useGeminiApiKey: 'Use Gemini API Key',
        useVertexAi: 'Vertex AI',
        mustSelectAuthMethod:
          'You must select an auth method to proceed. Press Ctrl+C twice to exit.',
        getStarted: 'Get Started',
        howToAuthenticate: 'How would you like to authenticate for this project?',
        pressEnterToSelect: '(Press Enter to select)',
        tosPrivacy: 'Terms of Service and Privacy Notice for Gemini CLI',
      },
      zh: {
        existingApiKey:
          '检测到现有的API密钥（GEMINI_API_KEY）。选择“Gemini API密钥”选项以使用它。',
        loginWithGoogle: '使用Google登录',
        useCloudShell: '使用Cloud Shell用户凭证',
        useGeminiApiKey: '使用Gemini API密钥',
        useVertexAi: 'Vertex AI',
        mustSelectAuthMethod:
          '您必须选择一种身份验证方法才能继续。按两次Ctrl+C退出。',
        getStarted: '开始使用',
        howToAuthenticate: '您想如何为此项目进行认证？',
        pressEnterToSelect: '(按Enter键选择)',
        tosPrivacy: 'Gemini CLI的服务条款和隐私声明',
      },
    };
    // Simple language detection. In a real app, you'd use a proper i18n library.
    const lang = process.env.LANG?.startsWith('zh') ? 'zh' : 'en';
    return translations[lang][key] || key;
  };

  return <PureAuthDialog {...props} t={t} />;
}
