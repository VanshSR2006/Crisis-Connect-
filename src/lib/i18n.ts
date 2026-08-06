import i18n from '@/i18n';

export type LanguageCode = 'en' | 'hi' | 'ka';

/**
 * Backward-compatible helper that routes to the global i18next instance.
 */
export function t(
  key: string,
  lang: LanguageCode,
  vars?: Record<string, string | number>
): string {
  return i18n.t(key, { lng: lang, ...vars });
}
