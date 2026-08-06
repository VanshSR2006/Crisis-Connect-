import { Alert } from '@/types';

export const mockAlerts: Alert[] = [
  {
    id: 'alt-301',
    title: 'RED ALERT: Yamuna River Danger Mark Crossed',
    message: 'Water levels exceeded 205.53m. Immediate evacuation ordered for low-lying areas in Uttarakhand Himalayan Sector.',
    title_translated: {
      en: 'RED ALERT: Yamuna River Danger Mark Crossed',
      hi: 'रेड अलर्ट: यमुना नदी का जलस्तर खतरे के निशान के पार',
      ka: 'ಕೆಂಪು ಎಚ್ಚರಿಕೆ: ಯಮುನಾ ನದಿಯ ಅಪಾಯದ ಮಟ್ಟ ದಾಟಿದೆ',
    },
    message_translated: {
      en: 'Water levels exceeded 205.53m. Immediate evacuation ordered for low-lying areas in Uttarakhand Himalayan Sector.',
      hi: 'जलस्तर 205.53 मीटर पार कर गया। उत्तरी नदी बेसिन के निचले इलाकों के लिए तत्काल निकासी के आदेश जारी।',
      ka: 'ನೀರಿನ ಮಟ್ಟ 205.53 ಮೀಟರ್ ಮೀರಿದೆ. ಉತ್ತರಾಖಂಡ ಹಿಮಾಲಯ ವಲಯದ ತಗ್ಗು ಪ್ರದೇಶಗಳಲ್ಲಿ ತಕ್ಷಣದ ಸ್ಥಳಾಂತರಕ್ಕೆ ಆದೇಶಿಸಲಾಗಿದೆ.',
    },
    severity: 'critical',
    target_zone_id: 'zone-north-01',
    issued_at: '2026-07-30T17:00:00Z',
    expires_at: '2026-07-31T17:00:00Z',
    issued_by_user_id: 'usr-002',
  },
  {
    id: 'alt-302',
    title: 'ORANGE ADVISORY: Flash Flood Warning',
    message: 'Heavy localized rainfall expected (>85mm/hr). Avoid underpasses and low-lying subways.',
    title_translated: {
      en: 'ORANGE ADVISORY: Flash Flood Warning',
      hi: 'ऑरेंज एडवाइजरी: अचानक बाढ़ की चेतावनी',
      ka: 'ಕಿತ್ತಳೆ ಸಲಹೆ: ಹಠಾತ್ ಪ್ರವಾಹದ ಮುನ್ನೆಚ್ಚರಿಕೆ',
    },
    message_translated: {
      en: 'Heavy localized rainfall expected (>85mm/hr). Avoid underpasses and low-lying subways.',
      hi: 'भारी स्थानीय बारिश (>85 मिमी/घंटा) की संभावना। अंडरपास और निचले सबवे से बचें।',
      ka: 'ಭಾರೀ ಸ್ಥಳೀಯ ಮಳೆ ನಿರೀಕ್ಷಿಸಲಾಗಿದೆ (>85 ಮಿಮೀ/ಗಂಟೆ). ಕೆಳಸೇತುವೆಗಳು ಮತ್ತು ತಗ್ಗು ಪ್ರದೇಶದ ಸುರಂಗಮಾರ್ಗಗಳನ್ನು ತಪ್ಪಿಸಿ.',
    },
    severity: 'high',
    target_zone_id: 'zone-east-02',
    issued_at: '2026-07-30T18:00:00Z',
    expires_at: '2026-07-31T06:00:00Z',
    issued_by_user_id: 'usr-002',
  },
  {
    id: 'alt-303',
    title: 'YELLOW NOTICE: Drainage Overflow Alert',
    message: 'Waterlogging reported across main arterial roads. Drive with caution.',
    title_translated: {
      en: 'YELLOW NOTICE: Drainage Overflow Alert',
      hi: 'येलो नोटिस: नाली ओवरफ्लो चेतावनी',
      ka: 'ಹಳದಿ ಸೂಚನೆ: ಒಳಚರಂಡಿ ಉಕ್ಕಿ ಹರಿಯುವ ಎಚ್ಚರಿಕೆ',
    },
    message_translated: {
      en: 'Waterlogging reported across main arterial roads. Drive with caution.',
      hi: 'मुख्य सड़कों पर जलभराव की सूचना। सावधानी से वाहन चलाएं।',
      ka: 'ಮುಖ್ಯ ರಸ್ತೆಗಳಲ್ಲಿ ಜಲಾವೃತವಾಗಿರುವ ಬಗ್ಗೆ ವರದಿಯಾಗಿದೆ. ಎಚ್ಚರಿಕೆಯಿಂದ ಚಾಲನೆ ಮಾಡಿ.',
    },
    severity: 'medium',
    target_zone_id: 'zone-south-03',
    issued_at: '2026-07-30T19:00:00Z',
    expires_at: '2026-07-31T12:00:00Z',
    issued_by_user_id: 'usr-004',
  },
  {
    id: 'alt-304',
    title: 'GREEN UPDATE: Central Zone Clear',
    message: 'Storm drains cleared and functioning normally. No immediate flood threat.',
    title_translated: {
      en: 'GREEN UPDATE: Central Zone Clear',
      hi: 'ग्रीन अपडेट: सेंट्रल जोन सामान्य',
      ka: 'ಹಸಿರು ನವೀಕರಣ: ಕೇಂದ್ರ ವಲಯ ಸುರಕ್ಷಿತ',
    },
    message_translated: {
      en: 'Storm drains cleared and functioning normally. No immediate flood threat.',
      hi: 'ड्रैन साफ़ कर दिए गए हैं और सामान्य रूप से काम कर रहे हैं। बाढ़ का कोई तत्काल खतरा नहीं है।',
      ka: 'ಮಳೆನೀರು ಚರಂಡಿಗಳನ್ನು ಸ್ವಚ್ಛಗೊಳಿಸಲಾಗಿದೆ ಮತ್ತು ಸಾಮಾನ್ಯವಾಗಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತಿದೆ. ತಕ್ಷಣದ ಪ್ರವಾಹದ ಭೀತಿ ಇಲ್ಲ.',
    },
    severity: 'low',
    target_zone_id: 'zone-central-04',
    issued_at: '2026-07-30T20:00:00Z',
    expires_at: '2026-07-31T20:00:00Z',
    issued_by_user_id: 'usr-004',
  },
];
