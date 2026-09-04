import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import hi from './locales/hi.json';
import ka from './locales/ka.json';

const getInitialLanguage = (): string => {
  if (typeof localStorage !== 'undefined') {
    try {
      const rawUser = localStorage.getItem('user');
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        if (parsed.language_pref && ['en', 'hi', 'ka'].includes(parsed.language_pref.toLowerCase())) {
          return parsed.language_pref.toLowerCase();
        }
      }
      const savedLng = localStorage.getItem('i18nextLng');
      if (savedLng && ['en', 'hi', 'ka'].includes(savedLng.toLowerCase())) {
        return savedLng.toLowerCase();
      }
    } catch {
      // Fallback on error
    }
  }
  return 'en';
};

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    ka: { translation: ka },
  },
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // react already safes from xss
  },
});

export default i18n;
