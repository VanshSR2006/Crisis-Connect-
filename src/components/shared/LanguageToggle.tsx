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
      className={`flex items-center gap-1 rounded-full border px-1.5 py-1 transition-all ${
        isDark
          ? 'bg-slate-100 border-slate-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)]'
          : 'bg-slate-900/90 border-slate-700/80 shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)]'
      } ${className}`}
      role="group"
      aria-label="Select language"
    >
      <Globe
        className={`h-3.5 w-3.5 ml-1 mr-0.5 shrink-0 ${
          isDark ? 'text-slate-600' : 'text-blue-400'
        }`}
      />
      {LANGUAGES.map((lang) => {
        const isActive = language === lang.code;
        return (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold tracking-wider transition-all duration-200 ease-out ${
              isActive
                ? isDark
                  ? 'bg-gradient-to-b from-slate-800 to-slate-900 text-white shadow-[0_3px_8px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.2)] -translate-y-0.5 border border-slate-700'
                  : 'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-[0_4px_10px_rgba(37,99,235,0.4),inset_0_1px_0_rgba(255,255,255,0.4)] -translate-y-0.5 border border-blue-400/40'
                : isDark
                ? 'text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
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
