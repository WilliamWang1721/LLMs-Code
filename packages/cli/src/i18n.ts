import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { homedir } from 'os';
import { SETTINGS_DIRECTORY_NAME } from './config/settings.js';

// 导入翻译文件
import enTranslation from './locales/en/translation.json' with { type: 'json' };
import zhCNTranslation from './locales/zh-CN/translation.json' with { type: 'json' };

// 尝试从配置文件中读取语言设置
function getLanguageFromConfig(): string {
  try {
    const configPath = path.join(homedir(), SETTINGS_DIRECTORY_NAME, 'config.yaml');
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      const config = yaml.load(configContent) as { language?: string };
      if (config && config.language && ['en', 'zh-CN'].includes(config.language)) {
        return config.language;
      }
    }
  } catch (error) {
    console.error('读取语言配置失败:', error);
  }
  return 'en'; // 默认语言
}

const resources = {
  en: {
    translation: enTranslation,
  },
  'zh-CN': {
    translation: zhCNTranslation,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: getLanguageFromConfig(), // 从配置文件中获取语言设置
  fallbackLng: 'en', // 备用语言
  interpolation: {
    escapeValue: false, // react already escapes by default
  },
});

export default i18n;
