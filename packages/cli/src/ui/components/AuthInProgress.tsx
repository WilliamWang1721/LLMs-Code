/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { Colors } from '../colors.js';
import { useTranslation } from 'react-i18next';

interface AuthInProgressProps {
  onTimeout: () => void;
}

export function AuthInProgress({
  onTimeout,
}: AuthInProgressProps): React.JSX.Element {
  const { t } = useTranslation();
  const [timedOut, setTimedOut] = useState(false);

  useInput((_, key) => {
    if (key.escape) {
      onTimeout();
    }
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimedOut(true);
      onTimeout();
    }, 180000);

    return () => clearTimeout(timer);
  }, [onTimeout]);

  return (
    <Box
      borderStyle="round"
      borderColor={Colors.Gray}
      flexDirection="column"
      padding={1}
      width="100%"
    >
      {timedOut ? (
        <Text color={Colors.AccentRed}>
          {t('auth.timeout')}
        </Text>
      ) : (
        <Box>
          <Text>
            <Spinner type="dots" /> {t('auth.waiting')} (Press ESC to cancel)
          </Text>
        </Box>
      )}
    </Box>
  );
}
