/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Box, Text } from 'ink';
import { Colors } from '../colors.js';
import { GIT_COMMIT_INFO } from '../../generated/git-commit.js';
import { useTranslation } from 'react-i18next';

interface AboutBoxProps {
  cliVersion: string;
  osVersion: string;
  sandboxEnv: string;
  modelVersion: string;
  selectedAuthType: string;
  gcpProject: string;
}

export const AboutBox: React.FC<AboutBoxProps> = ({
  cliVersion,
  osVersion,
  sandboxEnv,
  modelVersion,
  selectedAuthType,
  gcpProject,
}) => {
  const { t } = useTranslation();
  
  return (
  <Box
    borderStyle="round"
    borderColor={Colors.Gray}
    flexDirection="column"
    padding={1}
    marginY={1}
    width="100%"
  >
    <Box marginBottom={1}>
      <Text bold color={Colors.AccentPurple}>
        About LLMs Code
      </Text>
    </Box>
    <Box flexDirection="row">
      <Box width="35%">
        <Text bold color={Colors.LightBlue}>
          {t('aboutBox.cliVersion')}
        </Text>
      </Box>
      <Box>
        <Text>{cliVersion}</Text>
      </Box>
    </Box>
    {GIT_COMMIT_INFO && !['N/A'].includes(GIT_COMMIT_INFO) && (
      <Box flexDirection="row">
        <Box width="35%">
          <Text bold color={Colors.LightBlue}>
            {t('aboutBox.gitCommit')}
          </Text>
        </Box>
        <Box>
          <Text>{GIT_COMMIT_INFO}</Text>
        </Box>
      </Box>
    )}
    <Box flexDirection="row">
      <Box width="35%">
        <Text bold color={Colors.LightBlue}>
          {t('aboutBox.model')}
        </Text>
      </Box>
      <Box>
        <Text>{modelVersion}</Text>
      </Box>
    </Box>
    <Box flexDirection="row">
      <Box width="35%">
        <Text bold color={Colors.LightBlue}>
          {t('aboutBox.sandbox')}
        </Text>
      </Box>
      <Box>
        <Text>{sandboxEnv}</Text>
      </Box>
    </Box>
    <Box flexDirection="row">
      <Box width="35%">
        <Text bold color={Colors.LightBlue}>
          {t('aboutBox.os')}
        </Text>
      </Box>
      <Box>
        <Text>{osVersion}</Text>
      </Box>
    </Box>
    <Box flexDirection="row">
      <Box width="35%">
        <Text bold color={Colors.LightBlue}>
          {t('aboutBox.authMethod')}
        </Text>
      </Box>
      <Box>
        <Text>
          {selectedAuthType.startsWith('oauth') ? 'OAuth' : selectedAuthType}
        </Text>
      </Box>
    </Box>
    {gcpProject && (
      <Box flexDirection="row">
        <Box width="35%">
          <Text bold color={Colors.LightBlue}>
            {t('aboutBox.gcpProject')}
          </Text>
        </Box>
        <Box>
          <Text>{gcpProject}</Text>
        </Box>
      </Box>
    )}
  </Box>
);
};
