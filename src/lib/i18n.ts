export type LanguageCode = 'en' | 'hi' | 'ka';

export const translations = {
  // ──────────────────────────────────────────────
  // Login / Welcome Page
  // ──────────────────────────────────────────────
  login: {
    tagline: {
      en: 'CrisisConnect • Unified Emergency Network',
      hi: 'क्राइसिसकनेक्ट • एकीकृत आपातकालीन नेटवर्क',
      ka: 'ಕ್ರೈಸಿಸ್ಕನೆಕ್ಟ್ • ಏಕೀಕೃತ ತುರ್ತು ನೆಟ್ವರ್ಕ್',
    },
    headline: {
      en: 'Real-time Emergency Intelligence & Rapid Response',
      hi: 'वास्तविक समय आपातकालीन सूचना और त्वरित प्रतिक्रिया',
      ka: 'ನೈಜ-ಸಮಯದ ತುರ್ತು ಬುದ್ಧಿಮತ್ತೆ & ತ್ವರಿತ ಪ್ರತಿಕ್ರಿಯೆ',
    },
    subheadline: {
      en: 'Unified portal for command officers, field emergency teams, and citizens across high-risk flood and landslide zones in India.',
      hi: 'भारत के उच्च जोखिम वाले बाढ़ और भूस्खलन क्षेत्रों में कमान अधिकारियों, क्षेत्र आपातकालीन दलों और नागरिकों के लिए एकीकृत पोर्टल।',
      ka: 'ಭಾರತದ ಅಧಿಕ ಅಪಾಯದ ಪ್ರವಾಹ ಮತ್ತು ಭೂಕುಸಿತ ವಲಯಗಳಲ್ಲಿ ಕಮಾಂಡ್ ಅಧಿಕಾರಿಗಳು, ಕ್ಷೇತ್ರ ತುರ್ತು ತಂಡಗಳು ಮತ್ತು ನಾಗರಿಕರಿಗಾಗಿ ಏಕೀಕೃತ ಪೋರ್ಟಲ್.',
    },
    activeSectors: {
      en: 'Active Sectors',
      hi: 'सक्रिय क्षेत्र',
      ka: 'ಸಕ್ರಿಯ ವಲಯಗಳು',
    },
    dispatchTarget: {
      en: 'Dispatch Target',
      hi: 'प्रेषण लक्ष्य',
      ka: 'ರವಾನೆ ಗುರಿ',
    },
    sosToDispatch: {
      en: 'SOS report to resource dispatch',
      hi: 'SOS रिपोर्ट से संसाधन प्रेषण',
      ka: 'SOS ವರದಿಯಿಂದ ಸಂಪನ್ಮೂಲ ರವಾನೆ',
    },
    fieldResponse: {
      en: 'Field Response',
      hi: 'क्षेत्र प्रतिक्रिया',
      ka: 'ಕ್ಷೇತ್ರ ಪ್ರತಿಕ್ರಿಯೆ',
    },
    commandActive: {
      en: 'Command node active',
      hi: 'कमान नोड सक्रिय',
      ka: 'ಕಮಾಂಡ್ ನೋಡ್ ಸಕ್ರಿಯ',
    },
    liveZoneStatus: {
      en: 'Live Indian Disaster Zone Status',
      hi: 'लाइव भारतीय आपदा क्षेत्र स्थिति',
      ka: 'ನೇರ ಭಾರತೀಯ ವಿಪತ್ತು ವಲಯ ಸ್ಥಿತಿ',
    },
    realTimeMonitoring: {
      en: 'REAL-TIME INCIDENT MONITORING',
      hi: 'वास्तविक समय घटना निगरानी',
      ka: 'ನೈಜ-ಸಮಯ ಘಟನೆ ಮೇಲ್ವಿಚಾರಣೆ',
    },
    selectPortal: {
      en: 'Select Portal Access Level',
      hi: 'पोर्टल एक्सेस स्तर चुनें',
      ka: 'ಪೋರ್ಟಲ್ ಪ್ರವೇಶ ಮಟ್ಟ ಆಯ್ಕೆ ಮಾಡಿ',
    },
    secureAccess: {
      en: 'SECURE ACCESS',
      hi: 'सुरक्षित पहुंच',
      ka: 'ಸುರಕ್ಷಿತ ಪ್ರವೇಶ',
    },
    chooseRole: {
      en: 'Choose your authorized role to enter the emergency management platform.',
      hi: 'आपातकालीन प्रबंधन प्लेटफॉर्म में प्रवेश के लिए अपनी अधिकृत भूमिका चुनें।',
      ka: 'ತುರ್ತು ನಿರ್ವಹಣೆ ವೇದಿಕೆಗೆ ಪ್ರವೇಶಿಸಲು ನಿಮ್ಮ ಅಧಿಕೃತ ಪಾತ್ರ ಆಯ್ಕೆ ಮಾಡಿ.',
    },
    citizen: { en: 'Citizen', hi: 'नागरिक', ka: 'ನಾಗರಿಕ' },
    publicRelief: { en: 'Public Relief', hi: 'सार्वजनिक राहत', ka: 'ಸಾರ್ವಜನಿಕ ಪರಿಹಾರ' },
    officer: { en: 'Officer', hi: 'अधिकारी', ka: 'ಅಧಿಕಾರಿ' },
    commandCenter: { en: 'Command Center', hi: 'कमांड सेंटर', ka: 'ಕಮಾಂಡ್ ಕೇಂದ್ರ' },
    volunteer: { en: 'Volunteer', hi: 'स्वयंसेवक', ka: 'ಸ್ವಯಂಸೇವಕ' },
    fieldLogistics: { en: 'Field Logistics', hi: 'क्षेत्र रसद', ka: 'ಕ್ಷೇತ್ರ ಲಾಜಿಸ್ಟಿಕ್ಸ್' },
    emailLabel: { en: 'Verified Identity Email', hi: 'सत्यापित पहचान ईमेल', ka: 'ಪರಿಶೀಲಿತ ಗುರುತಿನ ಇಮೇಲ್' },
    zoneLabel: { en: 'Assigned Indian Disaster Zone', hi: 'निर्धारित भारतीय आपदा क्षेत्र', ka: 'ನಿಗದಿತ ಭಾರತೀಯ ವಿಪತ್ತು ವಲಯ' },
    enterPortal: { en: 'Enter', hi: 'प्रवेश करें', ka: 'ಪ್ರವೇಶಿಸಿ' },
    commandPortal: { en: 'Command Portal', hi: 'कमांड पोर्टल', ka: 'ಕಮಾಂಡ್ ಪೋರ್ಟಲ್' },
    systemsOperational: {
      en: 'All 4 Indian Emergency Command Systems Operational',
      hi: 'सभी 4 भारतीय आपातकालीन कमांड प्रणाली चालू',
      ka: 'ಎಲ್ಲಾ 4 ಭಾರತೀಯ ತುರ್ತು ಕಮಾಂಡ್ ಸಿಸ್ಟಮ್‌ಗಳು ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತಿವೆ',
    },
    activeDisasterZones: {
      en: '4 Active Disaster Response Zones',
      hi: '4 सक्रिय आपदा प्रतिक्रिया क्षेत्र',
      ka: '4 ಸಕ್ರಿಯ ವಿಪತ್ತು ಪ್ರತಿಕ್ರಿಯೆ ವಲಯಗಳು',
    },
  },

  // ──────────────────────────────────────────────
  // Citizen — Home
  // ──────────────────────────────────────────────
  citizenHome: {
    title: { en: 'Home', hi: 'होम', ka: 'ಮನೆ' },
    needHelp: { en: 'Need Emergency Assistance?', hi: 'आपातकालीन सहायता चाहिए?', ka: 'ತುರ್ತು ಸಹಾಯ ಬೇಕೇ?' },
    reportEmergency: { en: 'Report Emergency', hi: 'आपातकाल रिपोर्ट करें', ka: 'ತುರ್ತು ವರದಿ ಮಾಡಿ' },
    tapBelow: {
      en: 'Tap below to send immediate GPS coordinates and request rescue or medical teams.',
      hi: 'तत्काल GPS निर्देशांक भेजने और बचाव या चिकित्सा दल का अनुरोध करने के लिए नीचे टैप करें।',
      ka: 'ತಕ್ಷಣದ GPS ನಿರ್ದೇಶಾಂಕಗಳನ್ನು ಕಳುಹಿಸಲು ಮತ್ತು ರಕ್ಷಣಾ ಅಥವಾ ವೈದ್ಯಕೀಯ ತಂಡಗಳನ್ನು ವಿನಂತಿಸಲು ಕೆಳಗೆ ಟ್ಯಾಪ್ ಮಾಡಿ.',
    },
    emergencyDispatch: {
      en: 'Emergency Dispatch Network Active',
      hi: 'आपातकालीन प्रेषण नेटवर्क सक्रिय',
      ka: 'ತುರ್ತು ರವಾನೆ ನೆಟ್ವರ್ಕ್ ಸಕ್ರಿಯ',
    },
    sosTracker: { en: 'Your SOS Request Tracker', hi: 'आपका SOS अनुरोध ट्रैकर', ka: 'ನಿಮ್ಮ SOS ವಿನಂತಿ ಟ್ರ್ಯಾಕರ್' },
    yourLocation: { en: 'Your Location & Safety Map', hi: 'आपका स्थान और सुरक्षा मानचित्र', ka: 'ನಿಮ್ಮ ಸ್ಥಳ & ಸುರಕ್ಷತಾ ನಕ್ಷೆ' },
    gpsActive: { en: 'GPS Active', hi: 'GPS सक्रिय', ka: 'GPS ಸಕ್ರಿಯ' },
    nearbyShelters: { en: 'Nearby Evacuation Shelters', hi: 'निकटवर्ती निकासी आश्रय', ka: 'ಹತ್ತಿರದ ಸ್ಥಳಾಂತರ ಆಶ್ರಯಗಳು' },
    viewAll: { en: 'View All', hi: 'सभी देखें', ka: 'ಎಲ್ಲವನ್ನೂ ನೋಡಿ' },
    bedsFree: { en: 'Beds Free', hi: 'बिस्तर उपलब्ध', ka: 'ಹಾಸಿಗೆಗಳು ಲಭ್ಯ' },
    full: { en: 'Full', hi: 'पूर्ण', ka: 'ಭರ್ತಿ' },
  },

  // ──────────────────────────────────────────────
  // Citizen — Alerts
  // ──────────────────────────────────────────────
  citizenAlerts: {
    title: { en: 'Broadcast Alerts Feed', hi: 'प्रसारण अलर्ट फ़ीड', ka: 'ಪ್ರಸಾರ ಎಚ್ಚರಿಕೆ ಫೀಡ್' },
    subtitle: {
      en: 'Real-time public safety notifications · Zone broadcasts',
      hi: 'वास्तविक समय सार्वजनिक सुरक्षा सूचनाएं · क्षेत्र प्रसारण',
      ka: 'ನೈಜ-ಸಮಯ ಸಾರ್ವಜನಿಕ ಸುರಕ್ಷತಾ ಅಧಿಸೂಚನೆಗಳು · ವಲಯ ಪ್ರಸಾರಗಳು',
    },
    noAlerts: { en: 'No alerts match this filter.', hi: 'इस फ़िल्टर से कोई अलर्ट मेल नहीं खाता।', ka: 'ಈ ಫಿಲ್ಟರ್‌ಗೆ ಯಾವುದೇ ಎಚ್ಚರಿಕೆಗಳು ಹೊಂದಿಕೆಯಾಗುವುದಿಲ್ಲ.' },
    all: { en: 'All', hi: 'सभी', ka: 'ಎಲ್ಲಾ' },
    critical: { en: 'Critical', hi: 'गंभीर', ka: 'ಗಂಭೀರ' },
    high: { en: 'High', hi: 'उच्च', ka: 'ಹೆಚ್ಚಿನ' },
    medium: { en: 'Medium', hi: 'मध्यम', ka: 'ಮಧ್ಯಮ' },
    low: { en: 'Low', hi: 'कम', ka: 'ಕಡಿಮೆ' },
    issued: { en: 'Issued:', hi: 'जारी:', ka: 'ಜಾರಿ:' },
    zone: { en: 'Zone:', hi: 'क्षेत्र:', ka: 'ವಲಯ:' },
  },

  // ──────────────────────────────────────────────
  // Citizen — Shelters
  // ──────────────────────────────────────────────
  citizenShelters: {
    title: { en: 'Evacuation Shelters', hi: 'निकासी आश्रय', ka: 'ಸ್ಥಳಾಂತರ ಆಶ್ರಯಗಳು' },
    openShelters: { en: 'open shelters', hi: 'खुले आश्रय', ka: 'ತೆರೆದ ಆಶ್ರಯಗಳು' },
    bedsAvailable: { en: 'total beds available', hi: 'कुल बिस्तर उपलब्ध', ka: 'ಒಟ್ಟು ಹಾಸಿಗೆಗಳು ಲಭ್ಯ' },
    bedsFree: { en: 'Beds Free', hi: 'बिस्तर उपलब्ध', ka: 'ಹಾಸಿಗೆಗಳು ಲಭ್ಯ' },
    searchPlaceholder: { en: 'Search shelters by name or location...', hi: 'नाम या स्थान से आश्रय खोजें...', ka: 'ಹೆಸರು ಅಥವಾ ಸ್ಥಳದ ಮೂಲಕ ಆಶ್ರಯ ಹುಡುಕಿ...' },
    all: { en: 'All', hi: 'सभी', ka: 'ಎಲ್ಲಾ' },
    open: { en: 'Open', hi: 'खुला', ka: 'ತೆರೆದ' },
    full: { en: 'Full', hi: 'पूर्ण', ka: 'ಭರ್ತಿ' },
    atCapacity: { en: 'At Capacity', hi: 'क्षमता पर', ka: 'ಸಾಮರ್ಥ್ಯದಲ್ಲಿ' },
    closed: { en: 'Closed', hi: 'बंद', ka: 'ಮುಚ್ಚಿದ' },
    occupancy: { en: 'Occupancy', hi: 'अधिभोग', ka: 'ಅಧಿಕೃತ ಸಂಖ್ಯೆ' },
    contact: { en: 'Contact:', hi: 'संपर्क:', ka: 'ಸಂಪರ್ಕ:' },
    noShelters: { en: 'No shelters match your filter criteria.', hi: 'आपके फ़िल्टर मानदंड से कोई आश्रय मेल नहीं खाता।', ka: 'ನಿಮ್ಮ ಫಿಲ್ಟರ್ ಮಾನದಂಡಗಳಿಗೆ ಯಾವ ಆಶ್ರಯಗಳೂ ಹೊಂದಿಕೆಯಾಗುವುದಿಲ್ಲ.' },
    availableBeds: { en: 'beds available', hi: 'बिस्तर उपलब्ध', ka: 'ಹಾಸಿಗೆಗಳು ಲಭ್ಯ' },
  },

  // ──────────────────────────────────────────────
  // Citizen — Profile
  // ──────────────────────────────────────────────
  citizenProfile: {
    title: { en: 'Citizen Profile & Settings', hi: 'नागरिक प्रोफ़ाइल और सेटिंग्स', ka: 'ನಾಗರಿಕ ಪ್ರೊಫೈಲ್ & ಸೆಟ್ಟಿಂಗ್‌ಗಳು' },
    subtitle: { en: 'Verified emergency contact profile & portal preferences', hi: 'सत्यापित आपातकालीन संपर्क प्रोफ़ाइल और पोर्टल प्राथमिकताएं', ka: 'ಪರಿಶೀಲಿತ ತುರ್ತು ಸಂಪರ್ಕ ಪ್ರೊಫೈಲ್ & ಪೋರ್ಟಲ್ ಆದ್ಯತೆಗಳು' },
    verifiedCitizen: { en: 'Verified Resident Citizen', hi: 'सत्यापित निवासी नागरिक', ka: 'ಪರಿಶೀಲಿತ ನಿವಾಸಿ ನಾಗರಿಕ' },
    email: { en: 'Email', hi: 'ईमेल', ka: 'ಇಮೇಲ್' },
    phone: { en: 'Phone', hi: 'फ़ोन', ka: 'ಫೋನ್' },
    zone: { en: 'Assigned Zone', hi: 'निर्धारित क्षेत्र', ka: 'ನಿಗದಿತ ವಲಯ' },
    languagePreference: { en: 'Language Preference', hi: 'भाषा प्राथमिकता', ka: 'ಭಾಷಾ ಆದ್ಯತೆ' },
    selectLanguage: { en: 'Select app language', hi: 'ऐप भाषा चुनें', ka: 'ಅಪ್ಲಿಕೇಶನ್ ಭಾಷೆ ಆಯ್ಕೆ ಮಾಡಿ' },
    logout: { en: 'Sign Out', hi: 'साइन आउट', ka: 'ಸೈನ್ ಔಟ್' },
  },

  // ──────────────────────────────────────────────
  // Citizen — SOS Report
  // ──────────────────────────────────────────────
  citizenSos: {
    title: { en: 'SOS Emergency Report', hi: 'SOS आपातकालीन रिपोर्ट', ka: 'SOS ತುರ್ತು ವರದಿ' },
    subtitle: { en: 'Immediate distress signal · GPS coordinates auto-attached', hi: 'तत्काल संकट संकेत · GPS निर्देशांक स्वतः संलग्न', ka: 'ತಕ್ಷಣದ ಸಂಕಷ್ಟ ಸಂಕೇತ · GPS ನಿರ್ದೇಶಾಂಕಗಳು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಲಗತ್ತಿಸಲಾಗಿದೆ' },
    categoryLabel: { en: 'Emergency Category', hi: 'आपातकालीन श्रेणी', ka: 'ತುರ್ತು ವರ್ಗ' },
    floodRescue: { en: 'Flood / Rescue', hi: 'बाढ़ / बचाव', ka: 'ಪ್ರವಾಹ / ರಕ್ಷಣೆ' },
    medicalEmergency: { en: 'Medical Emergency', hi: 'चिकित्सा आपातकाल', ka: 'ವೈದ್ಯಕೀಯ ತುರ್ತು' },
    foodSupplies: { en: 'Food & Supplies', hi: 'भोजन और आपूर्ति', ka: 'ಆಹಾರ & ಸರಬರಾಜು' },
    shelterRelief: { en: 'Shelter Relief', hi: 'आश्रय राहत', ka: 'ಆಶ್ರಯ ಪರಿಹಾರ' },
    submitSos: { en: 'SEND SOS & REQUEST RESCUE TEAM', hi: 'SOS भेजें और बचाव दल का अनुरोध करें', ka: 'SOS ಕಳುಹಿಸಿ & ರಕ್ಷಣಾ ತಂಡ ವಿನಂತಿ ಮಾಡಿ' },
  },

  // ──────────────────────────────────────────────
  // Officer — General
  // ──────────────────────────────────────────────
  officer: {
    dashboard: { en: 'Command Overview', hi: 'कमांड अवलोकन', ka: 'ಕಮಾಂಡ್ ಅವಲೋಕನ' },
    liveMap: { en: 'Live GIS Map', hi: 'लाइव GIS मानचित्र', ka: 'ನೇರ GIS ನಕ್ಷೆ' },
    incidents: { en: 'Incident Reports', hi: 'घटना रिपोर्ट', ka: 'ಘಟನೆ ವರದಿಗಳು' },
    dispatch: { en: 'Dispatch Center', hi: 'प्रेषण केंद्र', ka: 'ರವಾನೆ ಕೇಂದ್ರ' },
    riskHeatmap: { en: 'Risk Heatmap', hi: 'जोखिम हीटमैप', ka: 'ಅಪಾಯ ಹೀಟ್‌ಮ್ಯಾಪ್' },
    analytics: { en: 'Analytics', hi: 'विश्लेषण', ka: 'ವಿಶ್ಲೇಷಣೆ' },
    criticalAlert: { en: 'Critical Alert Active', hi: 'गंभीर अलर्ट सक्रिय', ka: 'ಗಂಭೀರ ಎಚ್ಚರಿಕೆ ಸಕ್ರಿಯ' },
    zoneStream: { en: 'Zone Stream: Delhi NCR', hi: 'क्षेत्र स्ट्रीम: दिल्ली NCR', ka: 'ವಲಯ ಸ್ಟ್ರೀಮ್: ದೆಹಲಿ NCR' },
    switchRole: { en: 'Switch Role', hi: 'भूमिका बदलें', ka: 'ಪಾತ್ರ ಬದಲಿಸಿ' },
  },

  // ──────────────────────────────────────────────
  // Volunteer — General
  // ──────────────────────────────────────────────
  volunteer: {
    tasks: { en: 'Field Tasks', hi: 'क्षेत्र कार्य', ka: 'ಕ್ಷೇತ್ರ ಕಾರ್ಯಗಳು' },
    resources: { en: 'Resource Stock', hi: 'संसाधन भंडार', ka: 'ಸಂಪನ್ಮೂಲ ದಾಸ್ತಾನು' },
    fieldRadio: { en: 'Field Radio Active', hi: 'क्षेत्र रेडियो सक्रिय', ka: 'ಕ್ಷೇತ್ರ ರೇಡಿಯೋ ಸಕ್ರಿಯ' },
    switchRole: { en: 'Switch Role', hi: 'भूमिका बदलें', ka: 'ಪಾತ್ರ ಬದಲಿಸಿ' },
  },

  // ──────────────────────────────────────────────
  // Shared / Common
  // ──────────────────────────────────────────────
  common: {
    systemOperational: { en: 'System Operational', hi: 'सिस्टम चालू', ka: 'ಸಿಸ್ಟಮ್ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತಿದೆ' },
    liveFeedActive: { en: 'Live Feed Active', hi: 'लाइव फ़ीड सक्रिय', ka: 'ನೇರ ಫೀಡ್ ಸಕ್ರಿಯ' },
    loading: { en: 'Loading...', hi: 'लोड हो रहा है...', ka: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...' },
    sihActive: { en: 'SIH 2026 · PS#3 Active', hi: 'SIH 2026 · PS#3 सक्रिय', ka: 'SIH 2026 · PS#3 ಸಕ್ರಿಯ' },
  },
} as const;

export type TranslationKeys = typeof translations;

/** Helper: get translation for a path like t('login.headline') */
export function t(
  key: string,
  lang: LanguageCode,
  vars?: Record<string, string | number>
): string {
  const keys = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let node: any = translations;
  for (const k of keys) {
    if (node && typeof node === 'object' && k in node) {
      node = node[k];
    } else {
      return key; // fallback: return key if not found
    }
  }
  if (node && typeof node === 'object' && lang in node) {
    let result = node[lang] as string;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        result = result.replace(`{{${k}}}`, String(v));
      });
    }
    return result;
  }
  return key;
}
