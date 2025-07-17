import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 导入翻译文件
import enTranslation from './locales/en/translation.json';
import zhCNTranslation from './locales/zh-CN/translation.json';

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
  lng: 'en', // 默认语言
  fallbackLng: 'en', // 备用语言
  interpolation: {
    escapeValue: false, // react already escapes by default
  },
});

export default i18n;
