import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from '@/i18n';

export type LanguageCode = 'en' | 'hi' | 'ka';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(
    (i18n.language as LanguageCode) || 'en'
  );

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    i18n.changeLanguage(lang);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('i18nextLng', lang);
      try {
        const raw = localStorage.getItem('user');
        if (raw) {
          const userObj = JSON.parse(raw);
          userObj.language_pref = lang;
          localStorage.setItem('user', JSON.stringify(userObj));
        }
      } catch {
        // Ignore JSON error
      }
    }
  };

  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      if (lng === 'en' || lng === 'hi' || lng === 'ka') {
        setLanguageState(lng as LanguageCode);
      }
    };
    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

