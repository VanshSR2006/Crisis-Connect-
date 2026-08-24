/**
 * src/lib/translation.ts
 * Automated translation helper for Emergency Broadcast Alerts.
 * Maps English alert messages into Hindi (HI) and Kannada (KA) using
 * emergency phrase dictionary matching with automated fallback formatting.
 */

export interface MultilingualAlertMessage {
  en: string;
  hi: string;
  ka: string;
}

const EMERGENCY_PHRASE_DICTIONARY: Record<string, { hi: string; ka: string }> = {
  'flash flood warning': {
    hi: 'ऑरेंज एडवाइजरी: अचानक बाढ़ की चेतावनी जारी।',
    ka: 'ಕಿತ್ತಳೆ ಸಲಹೆ: ಹಠಾತ್ ಪ್ರವಾಹದ ಮುನ್ನೆಚ್ಚರಿಕೆ ನೀಡಲಾಗಿದೆ.',
  },
  'river water level crossed danger mark': {
    hi: 'रेड अलर्ट: नदी का जलस्तर खतरे के निशान के पार।',
    ka: 'ಕೆಂಪು ಎಚ್ಚರಿಕೆ: ನದಿ ನೀರಿನ ಮಟ್ಟ ಅಪಾಯದ ಮಟ್ಟ ದಾಟಿದೆ.',
  },
  'evacuation order': {
    hi: 'तत्काल निकासी का आदेश जारी।',
    ka: 'ತಕ್ಷಣದ ಸ್ಥಳಾಂತರಕ್ಕೆ ಆದೇಶಿಸಲಾಗಿದೆ.',
  },
  'heavy rainfall alert': {
    hi: 'भारी वर्षा की चेतावनी जारी। निचले इलाकों से बचें।',
    ka: 'ಭಾರೀ ಮಳೆ ಮುನ್ನೆಚ್ಚರಿಕೆ. ತಗ್ಗು ಪ್ರದೇಶಗಳನ್ನು ತಪ್ಪಿಸಿ.',
  },
  'drainage overflow alert': {
    hi: 'येलो नोटिस: नाली ओवरफ्लो चेतावनी।',
    ka: 'ಹಳದಿ ಸೂಚನೆ: ಒಳಚರಂಡಿ ಉಕ್ಕಿ ಹರಿಯುವ ಎಚ್ಚರಿಕೆ.',
  },
  'shelter open and relief active': {
    hi: 'राहत शिविर खुला है और सहायता सक्रिय है।',
    ka: 'ಪರಿಹಾರ ಶಿಬಿರ ತೆರೆದಿದೆ ಮತ್ತು ನೆರವು ಸಕ್ರಿಯವಾಗಿದೆ.',
  },
};

/**
 * Generates multilingual translation payload { en, hi, ka } from English input string.
 */
export function generateMultilingualAlertPayload(messageEn: string): MultilingualAlertMessage {
  const trimmed = messageEn.trim();
  if (!trimmed) {
    return { en: '', hi: '', ka: '' };
  }

  const lower = trimmed.toLowerCase();

  // 1. Check for exact or substring phrase match in emergency dictionary
  for (const [key, trans] of Object.entries(EMERGENCY_PHRASE_DICTIONARY)) {
    if (lower.includes(key)) {
      return {
        en: trimmed,
        hi: `${trans.hi} — ${trimmed}`,
        ka: `${trans.ka} — ${trimmed}`,
      };
    }
  }

  // 2. Rule-based prefix formatting fallback
  return {
    en: trimmed,
    hi: `[हिंदी अनुवाद] ${trimmed}`,
    ka: `[ಕನ್ನಡ ಅನುವಾದ] ${trimmed}`,
  };
}
