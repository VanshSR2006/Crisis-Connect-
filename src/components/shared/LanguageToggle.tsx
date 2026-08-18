import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage, LanguageCode } from '@/lib/languageContext';

interface LanguageToggleProps {
  /** Optional extra CSS classes for the wrapper */
  className?: string;
  /** 'dark' = dark pill background (for login page light bg), 'light' = light pill (for dark headers) */
  variant?: 'dark' | 'light';
}

const LANGUAGES: { code: LanguageCode; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'hi', label: 'HI' },
  { code: 'ka', label: 'KA' },
];

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  className = '',
  variant = 'dark',
}) => {
  const { language, setLanguage } = useLanguage();

  const isDark = variant === 'dark';

  return (
    <div
      className={`flex items-center gap-1 rounded-full border px-1 py-1 ${
        isDark
          ? 'bg-white/90 border-slate-200 shadow-sm'
          : 'bg-white/10 border-white/20'
      } ${className}`}
      role="group"
      aria-label="Select language"
    >
      <Globe
        className={`h-3.5 w-3.5 ml-1 mr-0.5 shrink-0 ${
          isDark ? 'text-slate-500' : 'text-white/70'
        }`}
      />
      {LANGUAGES.map((lang) => {
        const isActive = language === lang.code;
        return (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider transition-all duration-200 ${
              isActive
                ? isDark
                  ? 'bg-slate-900 text-white shadow-sm scale-105'
                  : 'bg-white text-slate-900 shadow-sm scale-105'
                : isDark
                ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                : 'text-white/80 hover:bg-white/20 hover:text-white'
            }`}
            aria-pressed={isActive}
            title={lang.code === 'en' ? 'English' : lang.code === 'hi' ? 'हिंदी' : 'ಕನ್ನಡ'}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
};
