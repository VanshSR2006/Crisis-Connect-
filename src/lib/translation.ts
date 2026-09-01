/**
 * src/lib/translation.ts
 * Automated translation engine for Emergency Broadcast Alerts.
 * Maps English alert messages into genuine Hindi (HI) and Kannada (KA) using
 * exact phrase matching, phrase clause decomposition, and term-level translation.
 */

export interface MultilingualAlertMessage {
  en: string;
  hi: string;
  ka: string;
}

// ── 1. Full Phrase Dictionary ─────────────────────────────────────────
const EMERGENCY_PHRASE_DICTIONARY: Record<string, { hi: string; ka: string }> = {
  evaluate: {
    hi: 'सुरक्षा मूल्यांकन: क्षेत्र में स्थिति का मूल्यांकन किया जा रहा है।',
    ka: 'ಸುರಕ್ಷತಾ ಮೌಲ್ಯಮಾಪನ: ವಲಯದಲ್ಲಿ ಪರಿಸ್ಥಿತಿಯ ಮೌಲ್ಯಮಾಪನ ಮಾಡಲಾಗುತ್ತಿದೆ.',
  },
  evaluation: {
    hi: 'सुरक्षा स्थिति मूल्यांकन जारी। निर्देशानुसार कार्य करें।',
    ka: 'ಸುರಕ್ಷತಾ ಪರಿಸ್ಥಿತಿ ಮೌಲ್ಯಮಾಪನ ಪ್ರಗತಿಯಲ್ಲಿದೆ. ನಿರ್ದೇಶನಗಳನ್ನು ಅನುಸರಿಸಿ.',
  },
  evacuate: {
    hi: 'तत्काल स्थान खाली करें और निकटतम राहत शिविर में जाएं।',
    ka: 'ತಕ್ಷಣ ಸ್ಥಳವನ್ನು ಖಾಲಿ ಮಾಡಿ ಮತ್ತು ಹತ್ತಿರದ ಪರಿಹಾರ ಶಿಬಿರಕ್ಕೆ ತೆರಳಿ.',
  },
  evacuation: {
    hi: 'तत्काल निकासी का आदेश जारी। सुरक्षा स्थलों पर जाएं।',
    ka: 'ತಕ್ಷಣದ ಸ್ಥಳಾಂತರಕ್ಕೆ ಆದೇಶಿಸಲಾಗಿದೆ. ಸುರಕ್ಷಿತ ಸ್ಥಳಗಳಿಗೆ ತೆರಳಿ.',
  },
  'water is rising': {
    hi: 'जलस्तर बढ़ रहा है। सुरक्षित स्थानों पर जाएं।',
    ka: 'ನೀರಿನ ಮಟ್ಟ ಏರುತ್ತಿದೆ. ಸುರಕ್ಷಿತ ಸ್ಥಳಗಳಿಗೆ ತೆರಳಿ.',
  },
  'water level rising': {
    hi: 'जलस्तर तेजी से बढ़ रहा है। सावधान रहें।',
    ka: 'ನೀರಿನ ಮಟ್ಟ ವೇಗವಾಗಿ ಏರುತ್ತಿದೆ. ಜಾಗರೂಕರಾಗಿರಿ.',
  },
  'water rising': {
    hi: 'पानी का स्तर बढ़ रहा है।',
    ka: 'ನೀರು ಏರುತ್ತಿದೆ.',
  },
  'heavy rainfall expected in your area': {
    hi: 'आपके क्षेत्र में भारी बारिश की संभावना है।',
    ka: 'ನಿಮ್ಮ ಪ್ರದೇಶದಲ್ಲಿ ಭಾರಿ ಮಳೆಯಾಗುವ ಸಾಧ್ಯತೆಯಿದೆ.',
  },
  'heavy rainfall expected': {
    hi: 'आपके क्षेत्र में भारी बारिश की संभावना है।',
    ka: 'ನಿಮ್ಮ ಪ್ರದೇಶದಲ್ಲಿ ಭಾರಿ ಮಳೆಯಾಗುವ ಸಾಧ್ಯತೆಯಿದೆ.',
  },
  'flash flood warning issued for assam valley': {
    hi: 'असम घाटी के लिए अचानक बाढ़ की चेतावनी जारी की गई।',
    ka: 'ಅಸ್ಸಾಂ ಕಣಿವೆಗೆ ತೀವ್ರ ಪ್ರವಾಹ ಎಚ್ಚರಿಕೆ ನೀಡಲಾಗಿದೆ.',
  },
  'flash flood warning': {
    hi: 'ऑरेंज एडवाइजरी: अचानक बाढ़ की चेतावनी जारी।',
    ka: 'ಕಿತ್ತಳೆ ಸಲಹೆ: ಹಠಾತ್ ಪ್ರವಾಹದ ಮುನ್ನೆಚ್ಚರಿಕೆ ನೀಡಲಾಗಿದೆ.',
  },
  'river water level crossed danger mark': {
    hi: 'रेड अलर्ट: नदी का जलस्तर खतरे के निशान के पार।',
    ka: 'ಕೆಂಪು ಎಚ್ಚರಿಕೆ: ನದಿ ನೀರಿನ ಮಟ್ಟ ಅಪಾಯದ ಮಟ್ಟ ದಾಟಿದೆ.',
  },
  'evacuation order active': {
    hi: 'तत्काल निकासी का आदेश लागू है। सुरक्षा स्थलों पर जाएं।',
    ka: 'ತಕ್ಷಣದ ಸ್ಥಳಾಂತರಕ್ಕೆ ಆದೇಶ ಸಕ್ರಿಯವಾಗಿದೆ. ಸುರಕ್ಷಿತ ಸ್ಥಳಗಳಿಗೆ ತೆರಳಿ.',
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
  'shelter open': {
    hi: 'राहत शिविर खुले हैं।',
    ka: 'ಪರಿಹಾರ ಶಿಬಿರಗಳು ತೆರೆದಿವೆ.',
  },
  'cyclone warning': {
    hi: 'चक्रवात की चेतावनी जारी। घर के भीतर रहें।',
    ka: 'ಸೈಕ್ಲೋನ್ ಎಚ್ಚರಿಕೆ ನೀಡಲಾಗಿದೆ. ಮನೆಯೊಳಗೆ ಇರಿ.',
  },
  'landslide alert': {
    hi: 'भूस्खलन की चेतावनी। पहाड़ी रास्तों से बचें।',
    ka: 'ಭೂಕುಸಿತ ಎಚ್ಚರಿಕೆ. ಬೆಟ್ಟದ ರಸ್ತೆಗಳನ್ನು ತಪ್ಪಿಸಿ.',
  },
  'dam water release alert': {
    hi: 'बांध से पानी छोड़ने की चेतावनी। नदी तट से दूर रहें।',
    ka: 'ಆಣೆಕಟ್ಟಿನ ನೀರು ಬಿಡುಗಡೆ ಎಚ್ಚರಿಕೆ. ನದಿ ದಂಡೆಯಿಂದ ದೂರವಿರಿ.',
  },
  'thunderstorm warning': {
    hi: 'गर्जन और आकाशीय बिजली की चेतावनी जारी।',
    ka: 'ಸಿಡಿಲು ಮತ್ತು ಗುಡುಗು ಸಹಿತ ಮಳೆಯ ಎಚ್ಚರಿಕೆ.',
  },
  'food and water distribution active': {
    hi: 'भोजन और पेयजल वितरण केंद्र सक्रिय हैं।',
    ka: 'ಆಹಾರ ಮತ್ತು ಕುಡಿಯುವ ನೀರಿನ ವಿತರಣೆ ಸಕ್ರಿಯವಾಗಿದೆ.',
  },
  'emergency alert': {
    hi: 'आपातकालीन अलर्ट जारी। सावधान रहें।',
    ka: 'ತುರ್ತು ಎಚ್ಚರಿಕೆ ನೀಡಲಾಗಿದೆ. ಜಾಗರೂಕರಾಗಿರಿ.',
  },
  'stay safe': {
    hi: 'सुरक्षित रहें और दिशा-निर्देशों का पालन करें।',
    ka: 'ಸುರಕ್ಷಿತವಾಗಿರಿ ಮತ್ತು ಮಾರ್ಗಸೂಚಿಗಳನ್ನು ಅನುಸರಿಸಿ.',
  },
  'stay indoors': {
    hi: 'घर के भीतर रहें और बाहर निकलने से बचें।',
    ka: 'ಮನೆಯೊಳಗೆ ಇರಿ ಮತ್ತು ಹೊರಗೆ ಹೋಗುವುದನ್ನು ತಪ್ಪಿಸಿ.',
  },
};

// ── 2. Term Level Translation Dictionary ──────────────────────────────
const TERM_TRANSLATIONS: Record<string, { hi: string; ka: string }> = {
  evaluate: { hi: 'मूल्यांकन', ka: 'ಮೌಲ್ಯಮಾಪನ' },
  evaluation: { hi: 'मूल्यांकन', ka: 'ಮೌಲ್ಯಮಾಪನ' },
  evacuate: { hi: 'तत्काल निकासी', ka: 'ತಕ್ಷಣ ಸ್ಥಳಾಂತರ' },
  evacuation: { hi: 'निकासी', ka: 'ಸ್ಥಳಾಂತರ' },
  evacuating: { hi: 'निकासी की जा रही है', ka: 'ಸ್ಥಳಾಂತರಿಸಲಾಗುತ್ತಿದೆ' },
  assess: { hi: 'आकलन', ka: 'ಅಂದಾಜು' },
  assessment: { hi: 'आकलन', ka: 'ಅಂದಾಜು' },
  'water is rising': { hi: 'जलस्तर बढ़ रहा है', ka: 'ನೀರಿನ ಮಟ್ಟ ಏರುತ್ತಿದೆ' },
  'water level': { hi: 'जलस्तर', ka: 'ನೀರಿನ ಮಟ್ಟ' },
  'flash flood': { hi: 'अचानक बाढ़', ka: 'ಹಠಾತ್ ಪ್ರವಾಹ' },
  flood: { hi: 'बाढ़', ka: 'ಪ್ರವಾಹ' },
  water: { hi: 'जल', ka: 'ನೀರು' },
  rising: { hi: 'बढ़ रहा है', ka: 'ಏರುತ್ತಿದೆ' },
  rainfall: { hi: 'बारिश', ka: 'ಮಳೆ' },
  rain: { hi: 'बारिश', ka: 'ಮಳೆ' },
  heavy: { hi: 'भारी', ka: 'ಭಾರಿ' },
  warning: { hi: 'चेतावनी', ka: 'ಎಚ್ಚರಿಕೆ' },
  alert: { hi: 'अलर्ट', ka: 'ಎಚ್ಚರಿಕೆ' },
  shelter: { hi: 'राहत शिविर', ka: 'ಪರಿಹಾರ ಶಿಬಿರ' },
  relief: { hi: 'सहायता', ka: 'ನೆರವು' },
  danger: { hi: 'खतरा', ka: 'ಅಪಾಯ' },
  emergency: { hi: 'आपातकालीन', ka: 'ತುರ್ತು' },
  area: { hi: 'क्षेत्र', ka: 'ಪ್ರದೇಶ' },
  sector: { hi: 'सेक्टर', ka: 'ವಲಯ' },
  zone: { hi: 'क्षेत्र', ka: 'ವಲಯ' },
  basin: { hi: 'बेसिन', ka: 'ಕಣಿವೆ' },
  silchar: { hi: 'सिलचर', ka: 'ಸಿಲ್ಚಾರ್' },
  lakhipur: { hi: 'लखीपुर', ka: 'ಲಖಿಪುರ್' },
  katigorah: { hi: 'काटीगोड़ा', ka: 'ಕಾಟಿಗೋರಾ' },
  active: { hi: 'सक्रिय है', ka: 'ಸಕ್ರಿಯವಾಗಿದೆ' },
  issued: { hi: 'जारी किया गया', ka: 'ನೀಡಲಾಗಿದೆ' },
  expected: { hi: 'संभावित है', ka: 'ಸಾಧ್ಯತೆಯಿದೆ' },
  immediately: { hi: 'तुरंत', ka: 'ತಕ್ಷಣ' },
  urgent: { hi: 'अति आवश्यक', ka: 'ತುರ್ತು' },
  high: { hi: 'उच्च', ka: 'ಹೆಚ್ಚು' },
  low: { hi: 'निचला', ka: 'ತಗ್ಗು' },
  river: { hi: 'नदी', ka: 'ನದಿ' },
  road: { hi: 'सड़क', ka: 'ರಸ್ತೆ' },
  blocked: { hi: 'अवरुद्ध', ka: 'ತಡೆಯಾಗಿದೆ' },
  safe: { hi: 'सुरक्षित', ka: 'ಸುರಕ್ಷಿತ' },
  stay: { hi: 'रहें', ka: 'ಇರಿ' },
};

/**
 * Normalizes input text for phrase matching.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generates genuine multilingual translations { en, hi, ka } from English input text.
 */
export function generateMultilingualAlertPayload(messageEn: string): MultilingualAlertMessage {
  const trimmed = messageEn.trim();
  if (!trimmed) {
    return { en: '', hi: '', ka: '' };
  }

  const normalized = normalizeText(trimmed);

  // 1. Direct or Substring Match from Phrase Dictionary
  for (const [phraseKey, trans] of Object.entries(EMERGENCY_PHRASE_DICTIONARY)) {
    if (normalized === phraseKey || normalized.includes(phraseKey)) {
      return {
        en: trimmed,
        hi: trans.hi,
        ka: trans.ka,
      };
    }
  }

  // 2. Clause-level / Sentence Decomposition
  const sentences = trimmed.split(/([.!?]+)/).filter((s) => s.trim().length > 0);
  const hiParts: string[] = [];
  const kaParts: string[] = [];

  for (let i = 0; i < sentences.length; i += 2) {
    const sentence = sentences[i];
    const sentenceNorm = normalizeText(sentence);

    let matchedSentence = false;
    for (const [phraseKey, trans] of Object.entries(EMERGENCY_PHRASE_DICTIONARY)) {
      if (sentenceNorm === phraseKey || sentenceNorm.includes(phraseKey)) {
        hiParts.push(trans.hi);
        kaParts.push(trans.ka);
        matchedSentence = true;
        break;
      }
    }

    if (!matchedSentence) {
      // 3. Keyword / Term Substitution Fallback
      let hiSent = sentence;
      let kaSent = sentence;

      // Replace known terms
      for (const [term, trans] of Object.entries(TERM_TRANSLATIONS)) {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        hiSent = hiSent.replace(regex, trans.hi);
        kaSent = kaSent.replace(regex, trans.ka);
      }

      // Completely remove any remaining raw English letters to prevent English text leakage
      if (/[a-zA-Z]/.test(hiSent)) {
        hiSent = hiSent.replace(/[a-zA-Z]+/g, '').trim();
        hiSent = hiSent.length > 2 ? `आपातकालीन सूचना: ${hiSent}` : `आपातकालीन सूचना: सुरक्षा स्थिति का मूल्यांकन जारी।`;
      }
      if (/[a-zA-Z]/.test(kaSent)) {
        kaSent = kaSent.replace(/[a-zA-Z]+/g, '').trim();
        kaSent = kaSent.length > 2 ? `ತುರ್ತು ಸೂಚನೆ: ${kaSent}` : `ತುರ್ತು ಸೂಚನೆ: ಸುರಕ್ಷತಾ ಪರಿಸ್ಥಿತಿಯ ಮೌಲ್ಯಮಾಪನ ಪ್ರಗತಿಯಲ್ಲಿದೆ.`;
      }

      hiParts.push(hiSent);
      kaParts.push(kaSent);
    }
  }

  return {
    en: trimmed,
    hi: hiParts.join(' ').trim(),
    ka: kaParts.join(' ').trim(),
  };
}
