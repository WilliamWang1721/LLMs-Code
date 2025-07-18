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
import { AuthType } from 'llms-code-core';
import { validateAuthMethod } from '../../config/auth.js';
import { useTranslation } from 'react-i18next';

interface AuthDialogProps {
  onSelect: (authMethod: AuthType | undefined, scope: SettingScope) => void;
  settings: LoadedSettings;
  initialErrorMessage?: string | null;
}

function parseDefaultAuthType(
  defaultAuthType: string | undefined
): AuthType | null {
  if (
    defaultAuthType &&
    Object.values(AuthType).includes(defaultAuthType as AuthType)
  ) {
    return defaultAuthType as AuthType;
  }
  return null;
}

export function AuthDialog({
  onSelect,
  settings,
  initialErrorMessage,
}: AuthDialogProps): React.JSX.Element {
  const { t } = useTranslation();
  const [errorMessage, setErrorMessage] = useState<string | null>(() => {
    if (initialErrorMessage) {
      return initialErrorMessage;
    }

    const defaultAuthType = parseDefaultAuthType(
      process.env.GEMINI_DEFAULT_AUTH_TYPE
    );

    if (process.env.GEMINI_DEFAULT_AUTH_TYPE && defaultAuthType === null) {
      return t('auth.invalidDefaultAuthType', {
        value: process.env.GEMINI_DEFAULT_AUTH_TYPE,
        validValues: Object.values(AuthType).join(', '),
      });
    }

    if (
      process.env.GEMINI_API_KEY &&
      (!defaultAuthType || defaultAuthType === AuthType.USE_GEMINI)
    ) {
      return t('auth.existingApiKey');
    }
    return null;
  });
  const items = [
    {
      label: t('auth.loginWithGoogle'),
      value: AuthType.LOGIN_WITH_GOOGLE,
    },
    ...(process.env.CLOUD_SHELL === 'true'
      ? [
          {
            label: t('auth.useCloudShell'),
            value: AuthType.CLOUD_SHELL,
          },
        ]
      : []),
    {
      label: t('auth.useGeminiApiKey'),
      value: AuthType.USE_GEMINI,
    },
    { label: t('auth.useVertexAi'), value: AuthType.USE_VERTEX_AI },
  ];

  const initialAuthIndex = items.findIndex((item) => {
    if (settings.merged.selectedAuthType) {
      return item.value === settings.merged.selectedAuthType;
    }

    const defaultAuthType = parseDefaultAuthType(
      process.env.GEMINI_DEFAULT_AUTH_TYPE
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
        setErrorMessage(t('auth.mustSelectAuthMethod'));
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
      <Text bold>{t('auth.getStarted')}</Text>
      <Box marginTop={1}>
        <Text>{t('auth.howToAuthenticate')}</Text>
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
        <Text color={Colors.Gray}>{t('auth.pressEnterToSelect')}</Text>
      </Box>
      <Box marginTop={1}>
        <Text>{t('auth.tosPrivacy')}</Text>
      </Box>
      <Box marginTop={1}>
        <Text color={Colors.AccentBlue}>{t('tosPrivacyLink')}</Text>
      </Box>
    </Box>
  );
}
