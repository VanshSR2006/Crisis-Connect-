import { Alert } from '@/types';

export const mockAlerts: Alert[] = [
  {
    id: 'alt-301',
    title: 'RED ALERT: Yamuna River Danger Mark Crossed',
    message: 'Water levels exceeded 205.53m. Immediate evacuation ordered for low-lying areas in Uttarakhand Himalayan Sector.',
    title_translated: {
      en: 'RED ALERT: Yamuna River Danger Mark Crossed',
      hi: 'रेड अलर्ट: यमुना नदी का जलस्तर खतरे के निशान के पार',
      ta: 'சிவப்பு எச்சரிக்கை: யமுனை ஆற்றின் ஆபத்து குறியீடு தாண்டியது',
    },
    message_translated: {
      en: 'Water levels exceeded 205.53m. Immediate evacuation ordered for low-lying areas in Uttarakhand Himalayan Sector.',
      hi: 'जलस्तर 205.53 मीटर पार कर गया। उत्तरी नदी बेसिन के निचले इलाकों के लिए तत्काल निकासी के आदेश जारी।',
      ta: 'நீர் மட்டம் 205.53 மீட்டரை தாண்டியது. வடக்கு ஆற்றுப் படுகையின் தாழ்வான பகுதிகளுக்கு உடனடி வெளியேற்றம் உத்தரவிடப்பட்டுள்ளது.',
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
      ta: 'ஆரஞ்சு எச்சரிக்கை: திடீர் வெள்ள எச்சரிக்கை',
    },
    message_translated: {
      en: 'Heavy localized rainfall expected (>85mm/hr). Avoid underpasses and low-lying subways.',
      hi: 'भारी स्थानीय बारिश (>85 मिमी/घंटा) की संभावना। अंडरपास और निचले सबवे से बचें।',
      ta: 'கனமழை எதிர்பார்க்கப்படுகிறது (>85மிமீ/மணி). சுரங்கப்பாதைகள் மற்றும் தாழ்வான பகுதிகளை தவிர்க்கவும்.',
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
      ta: 'மஞ்சள் அறிவிப்பு: வடிகால் வழிதல் எச்சரிக்கை',
    },
    message_translated: {
      en: 'Waterlogging reported across main arterial roads. Drive with caution.',
      hi: 'मुख्य सड़कों पर जलभराव की सूचना। सावधानी से वाहन चलाएं।',
      ta: 'முக்கிய சாலைகளில் நீர் தேக்கம் பதிவாகியுள்ளது. எச்சரிக்கையுடன் வாகனங்களை இயக்கவும்.',
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
      ta: 'பச்சை செய்தி: மத்திய மண்டலம் பாதுகாப்பானது',
    },
    message_translated: {
      en: 'Storm drains cleared and functioning normally. No immediate flood threat.',
      hi: 'ड्रैन साफ़ कर दिए गए हैं और सामान्य रूप से काम कर रहे हैं। बाढ़ का कोई तत्काल खतरा नहीं है।',
      ta: 'மழைநீர் வடிகால்கள் சுத்தம் செய்யப்பட்டு இயல்பாக இயங்குகின்றன. உடனடி வெள்ள அச்சுறுத்தல் இல்லை.',
    },
    severity: 'low',
    target_zone_id: 'zone-central-04',
    issued_at: '2026-07-30T20:00:00Z',
    expires_at: '2026-07-31T20:00:00Z',
    issued_by_user_id: 'usr-004',
  },
];
