/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Box, Text } from 'ink';
import { Colors } from '../colors.js';
import { type Config } from '@google/gemini-cli-core';
import { useTranslation } from 'react-i18next';

interface TipsProps {
  config: Config;
}

export const Tips: React.FC<TipsProps> = ({ config }) => {
  const { t } = useTranslation();
  const geminiMdFileCount = config.getGeminiMdFileCount();
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color={Colors.Foreground}>{t('tips.getStarted')}</Text>
      <Text color={Colors.Foreground}>
        {t('tips.askEditRun')}
      </Text>
      <Text color={Colors.Foreground}>
        {t('tips.beSpecific')}
      </Text>
      {geminiMdFileCount === 0 && (
        <Text color={Colors.Foreground}>
          {t('tips.createGeminiMd', { geminiMd: "GEMINI.md" })}
        </Text>
      )}
      <Text color={Colors.Foreground}>
        {t('tips.helpCommand', { number: geminiMdFileCount === 0 ? '4.' : '3.' })}
      </Text>
    </Box>
  );
};
