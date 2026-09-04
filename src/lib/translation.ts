/**
 * src/lib/translation.ts
 * Automated translation engine for Emergency Broadcast Alerts.
 * Maps English alert messages into genuine Hindi (HI) and Kannada (KA) using
 * phrase dictionary, term-level dictionary, and sentence structure translation.
 */

export interface MultilingualAlertMessage {
  en: string;
  hi: string;
  ka: string;
}

// ── 1. Full Phrase Dictionary ─────────────────────────────────────────
const EMERGENCY_PHRASE_DICTIONARY: Record<string, { hi: string; ka: string }> = {
  'trees are being cut': {
    hi: 'पेड़ काटे जा रहे हैं। सावधान रहें।',
    ka: 'ಮರಗಳನ್ನು ಕತ್ತರಿಸಲಾಗುತ್ತಿದೆ. ಜಾಗರೂಕರಾಗಿರಿ.',
  },
  'tree is being cut': {
    hi: 'पेड़ काटा जा रहा है। रास्ता अवरुद्ध हो सकता है।',
    ka: 'ಮರವನ್ನು ಕತ್ತರಿಸಲಾಗುತ್ತಿದೆ. ರಸ್ते ತಡೆಯಾಗಬಹುದು.',
  },
  'trees falling': {
    hi: 'पेड़ गिर रहे हैं। सुरक्षित दूरी बनाए रखें।',
    ka: 'ಮರಗಳು ಬೀಳುತ್ತಿವೆ. ಸುರಕ್ಷಿತ ಅಂತರವನ್ನು ಕಾಯ್ದುಕೊಳ್ಳಿ.',
  },
  'tree fallen on road': {
    hi: 'सड़क पर पेड़ गिर गया है। यातायात अवरुद्ध है।',
    ka: 'ರಸ್ತೆಯ ಮೇಲೆ ಮರ ಬಿದ್ದಿದೆ. ಸಂಚಾರ ತಡೆಯಾಗಿದೆ.',
  },
  thunderstorm: {
    hi: 'गर्जन और आकाशीय बिजली की चेतावनी जारी।',
    ka: 'ಸಿಡಿಲು ಮತ್ತು ಗುಡುಗು ಸಹಿತ ಮಳೆಯ ಎಚ್ಚರಿಕೆ.',
  },
  'thunderstorm warning': {
    hi: 'गर्जन और आकाशीय बिजली की चेतावनी जारी।',
    ka: 'ಸಿಡಿಲು ಮತ್ತು ಗುಡುಗು ಸಹಿತ ಮಳೆಯ ಎಚ್ಚರಿಕೆ.',
  },
  'thunderstorm alert': {
    hi: 'ऑरेंज अलर्ट: गर्जन और आकाशीय बिजली की चेतावनी जारी।',
    ka: 'ಕಿತ್ತಳೆ ಎಚ್ಚರಿಕೆ: ಸಿಡಿಲು ಮತ್ತು ಗುಡುಗು ಸಹಿತ ಮಳೆಯ ಎಚ್ಚರಿಕೆ.',
  },
  lightning: {
    hi: 'आकाशीय बिजली की चेतावनी जारी। पेड़ और खुले मैदान से दूर रहें।',
    ka: 'ಸಿಡಿಲು ಎಚ್ಚರಿಕೆ ನೀಡಲಾಗಿದೆ. ಮರಗಳು ಮತ್ತು ತೆರೆದ ಮೈದಾನದಿಂದ ದೂರವಿರಿ.',
  },
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
  'flash flood': {
    hi: 'अचानक बाढ़ की चेतावनी जारी।',
    ka: 'ಹಠಾತ್ ಪ್ರವಾಹದ ಮುನ್ನೆಚ್ಚರಿಕೆ ನೀಡಲಾಗಿದೆ.',
  },
  flood: {
    hi: 'बाढ़ की चेतावनी जारी। ऊंचे स्थानों पर जाएं।',
    ka: 'ಪ್ರವಾಹ ಎಚ್ಚರಿಕೆ ನೀಡಲಾಗಿದೆ. ಎತ್ತರದ ಸ್ಥಳಗಳಿಗೆ ತೆರಳಿ.',
  },
  flooding: {
    hi: 'क्षेत्र में जलभराव और बाढ़ की स्थिति।',
    ka: 'ಪ್ರದೇಶದಲ್ಲಿ ನೀರು ನಿಲ್ಲುವುದು ಮತ್ತು ಪ್ರವಾಹದ ಪರಿಸ್ಥಿತಿ.',
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
  'heavy rainfall': {
    hi: 'भारी बारिश की चेतावनी जारी।',
    ka: 'ಭಾರಿ ಮಳೆಯ ಎಚ್ಚರಿಕೆ ನೀಡಲಾಗಿದೆ.',
  },
  'heavy rain': {
    hi: 'भारी बारिश की चेतावनी जारी।',
    ka: 'ಭಾರಿ ಮಳೆಯ ಎಚ್ಚರಿಕೆ ನೀಡಲಾಗಿದೆ.',
  },
  rain: {
    hi: 'वर्षा और आंधी की संभावना।',
    ka: 'ಮಳೆ ಮತ್ತು ಬಿರುಗಾಳಿ ಸಾಧ್ಯತೆ.',
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
  shelter: {
    hi: 'निकटतम राहत शिविर में शरण लें।',
    ka: 'ಹತ್ತಿರದ ಪರಿಹಾರ ಶಿಬಿರದಲ್ಲಿ ಆಶ್ರಯ ಪಡೆಯಿರಿ.',
  },
  'cyclone warning': {
    hi: 'चक्रवात की चेतावनी जारी। घर के भीतर रहें।',
    ka: 'ಸೈಕ್ಲೋನ್ ಎಚ್ಚರಿಕೆ ನೀಡಲಾಗಿದೆ. ಮನೆಯೊಳಗೆ ಇರಿ.',
  },
  cyclone: {
    hi: 'चक्रवात की चेतावनी। सुरक्षित स्थानों पर रहें।',
    ka: 'ಸೈಕ್ಲೋನ್ ಎಚ್ಚರಿಕೆ. ಸುರಕ್ಷಿತ ಸ್ಥಳಗಳಲ್ಲಿ ಇರಿ.',
  },
  'landslide alert': {
    hi: 'भूस्खलन की चेतावनी। पहाड़ी रास्तों से बचें।',
    ka: 'ಭೂಕುಸಿತ ಎಚ್ಚರಿಕೆ. ಬೆಟ್ಟದ ರಸ್ತೆಗಳನ್ನು ತಪ್ಪಿಸಿ.',
  },
  landslide: {
    hi: 'भूस्खलन की चेतावनी जारी। सतर्क रहें।',
    ka: 'ಭೂಕುಸಿತದ ಎಚ್ಚರಿಕೆ ನೀಡಲಾಗಿದೆ. ಜಾಗರೂಕರಾಗಿರಿ.',
  },
  'dam water release alert': {
    hi: 'बांध से पानी छोड़ने की चेतावनी। नदी तट से दूर रहें।',
    ka: 'ಆಣೆಕಟ್ಟಿನ ನೀರು ಬಿಡುಗಡೆ ಎಚ್ಚರಿಕೆ. ನದಿ ದಂಡೆಯಿಂದ ದೂರವಿರಿ.',
  },
  'food and water distribution active': {
    hi: 'भोजन और पेयजल वितरण केंद्र सक्रिय हैं।',
    ka: 'ಆಹಾರ ಮತ್ತು ಕುಡಿಯುವ ನೀರಿನ ವಿತರಣೆ ಸಕ್ರಿಯವಾಗಿದೆ.',
  },
  'emergency alert': {
    hi: 'आपातकालीन अलर्ट जारी। सावधान रहें।',
    ka: 'ತುರ್ತು ಎಚ್ಚರಿಕೆ ನೀಡಲಾಗಿದೆ. ಜಾಗರೂಕರಾಗಿರಿ.',
  },
  emergency: {
    hi: 'आपातकालीन सूचना जारी।',
    ka: 'ತುರ್ತು ಸೂಚನೆ ನೀಡಲಾಗಿದೆ.',
  },
  sos: {
    hi: 'आपातकालीन संकट (SOS) सिग्नल दर्ज। सहायता भेजी जा रही है।',
    ka: 'ತುರ್ತು ಸಂಕಷ್ಟ (SOS) ಸಂಕೇತ ದಾಖಲಾಗಿದೆ. ನೆರವು ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ.',
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

// ── 2. Comprehensive Term Level Dictionary ─────────────────────────────
const TERM_TRANSLATIONS: Record<string, { hi: string; ka: string }> = {
  trees: { hi: 'पेड़', ka: 'ಮರಗಳು' },
  tree: { hi: 'पेड़', ka: 'ಮರ' },
  cut: { hi: 'काटे जा रहे', ka: 'ಕತ್ತರಿಸಲಾಗುತ್ತಿದೆ' },
  cutting: { hi: 'कटाई की जा रही', ka: 'ಕತ್ತರಿಸಲಾಗುತ್ತಿದೆ' },
  are: { hi: 'हैं', ka: 'ಇವೆ' },
  is: { hi: 'है', ka: 'ಇದೆ' },
  being: { hi: 'जा रहे', ka: 'ಆಗುತ್ತಿವೆ' },
  fall: { hi: 'गिर रहे', ka: 'ಬೀಳುತ್ತಿವೆ' },
  falling: { hi: 'गिर रहे', ka: 'ಬೀಳುತ್ತಿವೆ' },
  fallen: { hi: 'गिर गया', ka: 'ಬಿದ್ದಿದೆ' },
  bridge: { hi: 'पुल', ka: 'ಸೇತುವೆ' },
  collapsed: { hi: 'ढह गया', ka: 'ಕುಸಿದಿದೆ' },
  collapse: { hi: 'ढहना', ka: 'ಕುಸಿತ' },
  thunderstorm: { hi: 'गर्जन और आकाशीय बिजली', ka: 'ಸಿಡಿಲು ಮತ್ತು ಗುಡುಗು' },
  thunder: { hi: 'गर्जन', ka: 'ಗುಡುಗು' },
  lightning: { hi: 'बिजली', ka: 'ಸಿಡಿಲು' },
  storm: { hi: 'आंधी तूफान', ka: 'ಬಿರುಗಾಳಿ' },
  evaluate: { hi: 'मूल्यांकन', ka: 'ಮೌಲ್ಯಮಾಪನ' },
  evaluation: { hi: 'मूल्यांकन', ka: 'ಮೌಲ್ಯಮಾಪನ' },
  evacuate: { hi: 'तत्काल निकासी', ka: 'ತಕ್ಷಣ ಸ್ಥಳಾಂತರ' },
  evacuation: { hi: 'निकासी', ka: 'ಸ್ಥಳಾಂತರ' },
  evacuating: { hi: 'निकासी की जा रही है', ka: 'ಸ್ಥಳಾಂತರಿಸಲಾಗುತ್ತಿದೆ' },
  assess: { hi: 'आकलन', ka: 'ಅಂದाಜು' },
  assessment: { hi: 'आकलन', ka: 'ಅಂದಾಜು' },
  'water is rising': { hi: 'जलस्तर बढ़ रहा है', ka: 'ನೀರಿನ ಮಟ್ಟ ಏರುತ್ತಿದೆ' },
  'water level': { hi: 'जलस्तर', ka: 'ನೀರಿನ ಮಟ್ಟ' },
  'flash flood': { hi: 'अचानक बाढ़', ka: 'ಹಠಾತ್ ಪ್ರವಾಹ' },
  flood: { hi: 'बाढ़', ka: 'ಪ್ರವಾಹ' },
  flooding: { hi: 'जलभराव', ka: 'ನೀರು ನಿಲ್ಲುವುದು' },
  waterlog: { hi: 'जलभराव', ka: 'ನೀರು ನಿಲ್ಲುವುದು' },
  waterlogging: { hi: 'जलभराव', ka: 'ನೀರು ನಿಲ್ಲುವುದು' },
  water: { hi: 'जल', ka: 'ನೀರು' },
  rising: { hi: 'बढ़ रहा है', ka: 'ಏರುತ್ತಿದೆ' },
  rainfall: { hi: 'बारिश', ka: 'ಮಳೆ' },
  rain: { hi: 'बारिश', ka: 'ಮಳೆ' },
  heavy: { hi: 'भारी', ka: 'ಭಾರಿ' },
  cyclone: { hi: 'चक्रवात', ka: 'ಸೈಕ್ಲೋನ್' },
  landslide: { hi: 'भूस्खलन', ka: 'ಭೂಕುಸಿತ' },
  tsunami: { hi: 'सुनामी', ka: 'ಸುನಾಮಿ' },
  earthquake: { hi: 'भूकंप', ka: 'ಭೂಕಂಪ' },
  fire: { hi: 'आग', ka: 'ಬೆಂಕಿ' },
  dam: { hi: 'बांध', ka: 'ಆಣೆಕಟ್ಟು' },
  warning: { hi: 'चेतावनी', ka: 'ಎಚ್ಚರಿಕೆ' },
  alert: { hi: 'अलर्ट', ka: 'ಎಚ್ಚರಿಕೆ' },
  shelter: { hi: 'राहत शिविर', ka: 'ಪರಿಹಾರ ಶಿಬಿರ' },
  relief: { hi: 'सहायता', ka: 'ನೆರವು' },
  rescue: { hi: 'बचाव टीम', ka: 'ರಕ್ಷಣಾ ತಂಡ' },
  medical: { hi: 'चिकित्सा सहायता', ka: 'ವೈದ್ಯಕೀಯ ಸಹಾಯ' },
  food: { hi: 'खाद्यान्न', ka: 'ಆಹಾರ' },
  danger: { hi: 'खतरा', ka: 'ಅಪಾಯ' },
  emergency: { hi: 'आपातकालीन', ka: 'ತುರ್ತು' },
  sos: { hi: 'संकट SOS', ka: 'ಸಂಕಷ್ಟ SOS' },
  area: { hi: 'क्षेत्र', ka: 'ಪ್ರದೇಶ' },
  sector: { hi: 'सेक्टर', ka: 'ವಲಯ' },
  zone: { hi: 'क्षेत्र', ka: 'ವಲಯ' },
  basin: { hi: 'बेसिन', ka: 'ಕಣಿವೆ' },
  silchar: { hi: 'सिलचर', ka: 'ಸಿಲ್ಚಾರ್' },
  lakhipur: { hi: 'लखीपुर', ka: 'ಲಖಿಪುರ್' },
  katigorah: { hi: 'काटीगोड़ा', ka: 'ಕಾಟಿಗೋರಾ' },
  cachar: { hi: 'कछार', ka: 'ಕಾಚಾರ್' },
  assam: { hi: 'असम', ka: 'ಅಸ್ಸಾಂ' },
  delhi: { hi: 'दिल्ली', ka: 'ದೆಹಲಿ' },
  ncr: { hi: 'एनसीआर', ka: 'ಎನ್‌ಸಿಆರ್' },
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

  // 1. Direct or Bidirectional Substring Match from Phrase Dictionary
  for (const [phraseKey, trans] of Object.entries(EMERGENCY_PHRASE_DICTIONARY)) {
    if (
      normalized === phraseKey ||
      normalized.includes(phraseKey) ||
      (normalized.length >= 3 && phraseKey.includes(normalized))
    ) {
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
      if (
        sentenceNorm === phraseKey ||
        sentenceNorm.includes(phraseKey) ||
        (sentenceNorm.length >= 3 && phraseKey.includes(sentenceNorm))
      ) {
        hiParts.push(trans.hi);
        kaParts.push(trans.ka);
        matchedSentence = true;
        break;
      }
    }

    if (!matchedSentence) {
      // 3. Term-by-Term Word Substitution Engine
      const words = sentence.split(/\s+/);
      const hiTranslatedWords: string[] = [];
      const kaTranslatedWords: string[] = [];

      words.forEach((w) => {
        const cleanWord = w.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (TERM_TRANSLATIONS[cleanWord]) {
          hiTranslatedWords.push(TERM_TRANSLATIONS[cleanWord].hi);
          kaTranslatedWords.push(TERM_TRANSLATIONS[cleanWord].ka);
        }
      });

      let hiResult = hiTranslatedWords.length > 0 ? hiTranslatedWords.join(' ') : '';
      let kaResult = kaTranslatedWords.length > 0 ? kaTranslatedWords.join(' ') : '';

      if (hiResult) {
        hiResult = `आपातकालीन अलर्ट: ${hiResult}।`;
      } else {
        hiResult = `आपातकालीन सूचना: ${trimmed}।`;
      }

      if (kaResult) {
        kaResult = `ತುರ್ತು ಎಚ್ಚರಿಕೆ: ${kaResult}.`;
      } else {
        kaResult = `ತುರ್ತು ಸೂಚನೆ: ${trimmed}.`;
      }

      hiParts.push(hiResult);
      kaParts.push(kaResult);
    }
  }

  return {
    en: trimmed,
    hi: hiParts.join(' ').trim(),
    ka: kaParts.join(' ').trim(),
  };
}
