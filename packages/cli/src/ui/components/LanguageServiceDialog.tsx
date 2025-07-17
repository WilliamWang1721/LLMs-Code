/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { Colors } from '../colors.js';
import { RadioButtonSelect } from './shared/RadioButtonSelect.js';

interface LanguageServiceDialogProps {
  onComplete: (language: string, service: string) => void;
}

export enum Language {
  CHINESE = 'chinese',
  ENGLISH = 'english',
}

export enum Service {
  OPENAI = 'openai',
  CLAUDE = 'claude',
  GEMINI = 'gemini',
}

export function LanguageServiceDialog({
  onComplete,
}: LanguageServiceDialogProps): React.JSX.Element {
  const [step, setStep] = useState<'language' | 'service'>('language');
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const languageItems = [
    {
      label: t('language.chinese'),
      value: Language.CHINESE,
    },
    {
      label: t('language.english'),
      value: Language.ENGLISH,
    },
  ];

  const serviceItems = [
    {
      label: 'OpenAI',
      value: Service.OPENAI,
    },
    {
      label: 'Claude',
      value: Service.CLAUDE,
    },
    {
      label: 'Gemini',
      value: Service.GEMINI,
    },
  ];

  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguage(language);
    setStep('service');
    setErrorMessage(null); // 清除可能存在的错误信息
  };

  const handleServiceSelect = (service: Service) => {
    if (selectedLanguage) {
      onComplete(selectedLanguage, service);
    } else {
      setErrorMessage(t('languageServiceDialog.selectLanguageFirst'));
    }
  };

  useInput((_input, key) => {
    if (key.escape) {
      if (step === 'service') {
        setStep('language');
      } else {
        // 如果在语言选择步骤按Esc，调用onComplete回调，传递空值表示取消
        // If Esc is pressed in language selection step, call onComplete with empty values to indicate cancellation
        onComplete('', '');
      }
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
      {step === 'language' ? (
        <>
          <Text bold>{t('languageServiceDialog.selectLanguage')}</Text>
          <Box marginTop={1}>
            <RadioButtonSelect
              items={languageItems}
              initialIndex={0}
              onSelect={handleLanguageSelect}
              isFocused={true}
            />
          </Box>
        </>
      ) : (
        <>
          <Text bold>{t('languageServiceDialog.selectService')}</Text>
          <Box marginTop={1}>
            <RadioButtonSelect
              items={serviceItems}
              initialIndex={2} // 默认选择Gemini
              onSelect={handleServiceSelect}
              isFocused={true}
            />
          </Box>
        </>
      )}
      {errorMessage && (
        <Box marginTop={1}>
          <Text color={Colors.AccentRed}>{errorMessage}</Text>
        </Box>
      )}
      <Box marginTop={1}>
        <Text color={Colors.Gray}>
          {step === 'language'
            ? t('languageServiceDialog.pressEnterToSelect')
            : t('languageServiceDialog.pressEnterToSelectEscToGoBack')}
        </Text>
      </Box>
    </Box>
  );
}