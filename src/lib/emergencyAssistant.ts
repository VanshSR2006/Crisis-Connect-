import { LanguageCode } from './languageContext';
import { Shelter } from '@/types';
import { getShelters } from './api/shelters';
import { getAlerts } from './api/alerts';
import { createIncident, buildIncidentPayload } from './api/incidents';
import { enqueueSosReport } from './offlineQueue';
import { generateReferenceId } from './generateReferenceId';
import { getStoredUser } from './auth';

/** Known Indian city coordinate dictionary for natural language location mapping */
export const CITY_COORDINATES: Record<string, { lat: number; lng: number; displayName: string }> = {
  bangalore: { lat: 12.9716, lng: 77.5946, displayName: 'Bangalore' },
  bengaluru: { lat: 12.9716, lng: 77.5946, displayName: 'Bengaluru' },
  whitefield: { lat: 12.9698, lng: 77.7500, displayName: 'Whitefield, Bengaluru' },
  indiranagar: { lat: 12.9784, lng: 77.6408, displayName: 'Indiranagar, Bengaluru' },
  koramangala: { lat: 12.9352, lng: 77.6245, displayName: 'Koramangala, Bengaluru' },
  marathahalli: { lat: 12.9591, lng: 77.6974, displayName: 'Marathahalli, Bengaluru' },
  hsr: { lat: 12.9121, lng: 77.6446, displayName: 'HSR Layout, Bengaluru' },
  hebbal: { lat: 13.0358, lng: 77.5970, displayName: 'Hebbal, Bengaluru' },
  jayanagar: { lat: 12.9308, lng: 77.5838, displayName: 'Jayanagar, Bengaluru' },
  silchar: { lat: 24.8250, lng: 92.7950, displayName: 'Silchar' },
  guwahati: { lat: 26.1445, lng: 91.7362, displayName: 'Guwahati' },
  delhi: { lat: 28.6139, lng: 77.2090, displayName: 'Delhi NCR' },
  noida: { lat: 28.5355, lng: 77.3910, displayName: 'Noida' },
  gurgaon: { lat: 28.4595, lng: 77.0266, displayName: 'Gurugram' },
  gurugram: { lat: 28.4595, lng: 77.0266, displayName: 'Gurugram' },
  mumbai: { lat: 19.0760, lng: 72.8777, displayName: 'Mumbai' },
  pune: { lat: 18.5204, lng: 73.8567, displayName: 'Pune' },
  kolkata: { lat: 22.5726, lng: 88.3639, displayName: 'Kolkata' },
  chennai: { lat: 13.0827, lng: 80.2707, displayName: 'Chennai' },
  hyderabad: { lat: 17.3850, lng: 78.4867, displayName: 'Hyderabad' },
  jaipur: { lat: 26.9124, lng: 75.7873, displayName: 'Jaipur' },
  lucknow: { lat: 26.8467, lng: 80.9462, displayName: 'Lucknow' },
  ahmedabad: { lat: 23.0225, lng: 72.5714, displayName: 'Ahmedabad' },
  bhopal: { lat: 23.2599, lng: 77.4126, displayName: 'Bhopal' },
  kochi: { lat: 9.9312, lng: 76.2673, displayName: 'Kochi' },
  cochin: { lat: 9.9312, lng: 76.2673, displayName: 'Kochi' },
  chandigarh: { lat: 30.7333, lng: 76.7794, displayName: 'Chandigarh' },
  patna: { lat: 25.5941, lng: 85.1376, displayName: 'Patna' },
  bhubaneswar: { lat: 20.2961, lng: 85.8245, displayName: 'Bhubaneswar' },
  dehradun: { lat: 30.3165, lng: 78.0322, displayName: 'Dehradun' },
  assam: { lat: 24.8250, lng: 92.7950, displayName: 'Assam' },
};

/**
 * Calculates Haversine distance in kilometers between two lat/lng coordinates.
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Detects immediate life-threatening danger, flood, or rescue distress in natural language.
 */
export function detectEmergencyIntent(message: string): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();

  // 1. English & code-mixed patterns
  const patterns = [
    /\b(in\s+danger|trapped|drowning|water\s+is\s+rising|rising\s+water|flood(ing)?\s+here|need\s+rescue|send\s+rescue|send\s+help|emergency|urgent(\s+help)?|save\s+me|stuck\s+in|stuck|stranded|surrounded\s+by\s+water|flood\s+water|help\s+me|need\s+help|help\s+chahiye|rescue\s+me|please\s+help|life\s+threatened|sinking|cannot\s+escape)\b/,
    /\b(khatra|khatre|phas\s+gaya|fas\s+gaya|phas|fas|paani\s+badh\s+raha|pani\s+badh\s+raha|madad\s+chahiye|madad|bachao|rescue\s+karo|doob\s+raha|flood\s+aa\s+gaya)\b/,
    /\b(apaya|silukikondiddene|neeru\s+hecchagide|neeru\s+bartha\s+ide|sahaya\s+beku|sahaya|rakshisi|muluguttiddene)\b/,
  ];

  if (patterns.some((pattern) => pattern.test(lower))) {
    return true;
  }

  // Devanagari script emergency terms
  if (/खतरा|फंसा|फंसे|पानी\s*बढ़|मदद|बचाओ|रेस्क्यू|डूब|बाढ़|आपातकालीन|सहायता/.test(message)) {
    return true;
  }

  // Kannada script emergency terms
  if (/ಅಪಾಯ|ಸಿಲುಕಿಕೊಂಡಿದ್ದೇನೆ|ನೀರು|ಪ್ರವಾಹ|ಸಹಾಯ|ರಕ್ಷಿಸಿ|ಮುಳುಗುತ್ತಿದ್ದೇನೆ|ತುರ್ತು/.test(message)) {
    return true;
  }

  return false;
}

/**
 * Detects whether the user is asking about evacuation shelters or relief camps.
 */
export function detectShelterQuery(message: string): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();

  const englishPatterns = [
    /\b(shelter|shelters|relief\s+camp|safe\s+place|where\s+can\s+i\s+go|evacuation\s+center|safest\s+shelter|nearest\s+shelter|safe\s+shelter)\b/,
    /\b(aashray|ashray|shelter\s+batao|rahat\s+shivir|kahan\s+jaun|surakshit\s+sthan|surakshit\s+aashray)\b/,
    /\b(ashraya|shelter\s+yelli|elli\s+hogabeku|surakshita\s+ashraya)\b/,
  ];
  if (englishPatterns.some((p) => p.test(lower))) {
    return true;
  }

  if (/आश्रय|शेल्टर|राहत\s*शिविर|कहाँ\s*जाऊं|सुरक्षित\s*स्थान/.test(message)) {
    return true;
  }

  if (/ಆಶ್ರಯ|ಶೆಲ್ಟರ್|ಎಲ್ಲಿಗೆ\s*ಹೋಗಬೇಕು|ಸುರಕ್ಷಿತ\s*ತಾಣ/.test(message)) {
    return true;
  }

  return false;
}

/**
 * Detects whether the user is asking about active disaster alerts or warnings.
 */
export function detectAlertsQuery(message: string): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();

  const patterns = [
    /\b(alert|alerts|warning|warnings|active\s+disaster|disaster|disasters|disaster\s+warning|flood\s+alert|under\s+warning)\b/,
    /\b(chetawani|alert\s+hai|koyi\s+alert)\b/,
    /\b(echcharike)\b/,
  ];
  if (patterns.some((p) => p.test(lower))) {
    return true;
  }
  if (/अलर्ट|चेतावनी|सूचना|एक्टिव|सक्रिय|ಎಚ್ಚರಿಕೆ|ಅಲರ್ಟ್/.test(message)) {
    return true;
  }
  return false;
}

/**
 * Detects affirmative confirmation (yes, proceed, please, haan, haudu, etc.)
 * Strictly returns false if the message contains negation (e.g. "yes, don't send it").
 */
export function detectAffirmative(message: string): boolean {
  if (!message) return false;
  const clean = message.trim().toLowerCase();

  // If there is any negation word or phrase, it cannot be an affirmative confirmation
  if (
    /\b(don'?t|do\s+not|never|not|no|nahi|mat|beda|illa|cancel|stop)\b/i.test(clean) ||
    /नहीं|मत|ಬೇಡ|ರದ್ದು|ಇಲ್ಲ/.test(clean)
  ) {
    return false;
  }

  // Exact match on common single-word or short affirmative confirmations
  const exactPatterns = [
    /^(yes|yeah|yep|yup|sure|ok|okay|please|proceed|send\s+it|send\s+help|dispatch|dispatch\s+it|do\s+it|okay\s+send|yes\s+please|yes\s+send|yes\s+dispatch)$/i,
    /^(haan|ha|haa|theek\s+hai|karo|bhejo|haan\s+bhejo|madad\s+bhejo|sahi\s+hai)$/i,
    /^(avudu|haudu|sari|hogi|kalsi|kalisi|kaluhisi|haudu\s+kalisi)$/i,
    /^(हाँ|हां|हाँ\s*भेजो|भेज\s*दो|मदद\s*भेजो|ठीक\s*है|अवश्य)$/,
    /^(ಹೌದು|ಹೌದು\s*ಕಳಿಸಿ|ಸರಿ|ಕಳುಹಿಸಿ)$/,
  ];

  if (exactPatterns.some((p) => p.test(clean))) {
    return true;
  }

  // Compound affirmations starting with yes/haan/haudu that confirm dispatch
  if (
    /^(yes|yeah|yep|sure|haan|ha|haudu|avudu)[,.\s]+(send(\s+help|\s+it)?|dispatch(\s+it)?|do\s+it|please|i\s+need\s+help|i\s+am\s+trapped|madad\s+bhejo|kalisi)\b/i.test(
      clean
    )
  ) {
    return true;
  }

  // Direct dispatch commands: "send help", "send rescue", "dispatch rescue now"
  if (/^(send\s+help|send\s+rescue|dispatch\s+rescue|dispatch\s+it\s+now|send\s+the\s+report)$/i.test(clean)) {
    return true;
  }

  return false;
}

/**
 * Detects negative response (no, nah, nahi, illa, beda, etc.)
 */
export function detectNegative(message: string): boolean {
  if (!message) return false;
  const clean = message.trim().toLowerCase();

  // Explicit standalone or short negative words
  if (/^(no|nah|nope|not\s+now|cancel|stop|never|nevermind|nahi|mat|illa|beda)$/i.test(clean)) {
    return true;
  }

  // Phrases expressing negation or refusal
  const negativePhrases = [
    /\b(no\s+thanks|no\s+need|don'?t\s+send|do\s+not\s+send|don'?t\s+dispatch|do\s+not\s+dispatch|not\s+now|no\s+sos|don'?t\s+report|do\s+not\s+report|cancel\s+(it|report|sos)?|stop\s+(it|sending|dispatch)?)\b/i,
    /\b(nahi\s+chahiye|mat\s+bhejo|bhejna\s+mat|nahi\s+bhejna|cancel\s+karo|band\s+karo)\b/i,
    /\b(beda|kaliso\s+beda|kalasbeda|beda\s+nange|cancel\s+madi|nillisi)\b/i,
    /नहीं|मत\s*भेजो|रद्द|ಬೇಡ|ಕಳಿಸಬೇಡಿ|ರದ್ದು/,
  ];

  if (negativePhrases.some((p) => p.test(clean))) {
    return true;
  }

  // Leading "no", "nahi", "illa", "beda", "don't" followed by other text (e.g. "no just tell me a shelter", "no I only want...")
  if (/^(no|nah|nope|nahi|illa|beda|don'?t)\b/i.test(clean)) {
    return true;
  }

  return false;
}

/**
 * Extracts recognized city or landmark coordinates from natural language message.
 */
export function extractLocationFromText(
  message: string
): { locationName: string; lat: number; lng: number } | null {
  if (!message) return null;
  const lower = message.toLowerCase();

  // 1. Direct dictionary match
  for (const [key, val] of Object.entries(CITY_COORDINATES)) {
    const regex = new RegExp(`\\b${key}\\b`, 'i');
    if (regex.test(lower)) {
      return {
        locationName: val.displayName,
        lat: val.lat,
        lng: val.lng,
      };
    }
  }

  // 2. Hindi / Kannada city names
  if (/बेंगलुरु|बैंगलोर/.test(message)) {
    return { locationName: 'Bengaluru', lat: 12.9716, lng: 77.5946 };
  }
  if (/ದೆಹಲಿ|ದೆಹಲಿ/.test(message) || /दिल्ली/.test(message)) {
    return { locationName: 'Delhi NCR', lat: 28.6139, lng: 77.2090 };
  }
  if (/ಸಿಲ್ಚಾರ್/.test(message) || /सिलचर/.test(message)) {
    return { locationName: 'Silchar', lat: 24.8250, lng: 92.7950 };
  }
  if (/ಮುಂಬೈ/.test(message) || /मुंबई/.test(message)) {
    return { locationName: 'Mumbai', lat: 19.0760, lng: 72.8777 };
  }
  if (/ಬೆಂಗಳೂರು/.test(message)) {
    return { locationName: 'Bengaluru', lat: 12.9716, lng: 77.5946 };
  }

  return null;
}

/**
 * Finds the nearest suitable shelter from real backend shelters.
 */
export async function findNearestSafeShelter(
  targetLat: number,
  targetLng: number
): Promise<{
  shelter: Shelter;
  distanceKm: number;
  availableBeds: number;
} | null> {
  const allShelters = await getShelters();
  if (!allShelters || allShelters.length === 0) {
    return null;
  }

  const openShelters = allShelters.filter((s) => s.status === 'open' && s.capacity > s.current_occupancy);
  const candidates = openShelters.length > 0 ? openShelters : allShelters;

  let bestShelter: Shelter = candidates[0];
  let minDistance = calculateDistanceKm(targetLat, targetLng, bestShelter.lat, bestShelter.lng);

  for (const s of candidates) {
    const dist = calculateDistanceKm(targetLat, targetLng, s.lat, s.lng);
    if (dist < minDistance) {
      minDistance = dist;
      bestShelter = s;
    }
  }

  return {
    shelter: bestShelter,
    distanceKm: minDistance,
    availableBeds: Math.max(0, bestShelter.capacity - bestShelter.current_occupancy),
  };
}

/**
 * Submits an unauthenticated or authenticated Emergency SOS incident report directly.
 */
export async function submitEmergencyIncident(params: {
  description: string;
  lat: number;
  lng: number;
  locationName?: string;
}): Promise<{ id: string; referenceId: string; status: 'sent' | 'queued' }> {
  const referenceId = generateReferenceId();
  const storedUser = getStoredUser();
  const reporterId = storedUser?.id || undefined;

  const payload = buildIncidentPayload({
    title: 'Emergency SOS Report',
    description: `Emergency distress reported via Crisis Assistant: ${params.description} (Location: ${
      params.locationName || `${params.lat.toFixed(4)}, ${params.lng.toFixed(4)}`
    })`,
    category: 'rescue',
    severity: 'critical',
    lat: params.lat,
    lng: params.lng,
    zone_id: (storedUser as any)?.zone_id || 'z-silchar',
    reporter_id: reporterId,
    client_id: referenceId,
  });

  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const res = await createIncident(payload, { idempotencyKey: referenceId });
      if (res && res.id) {
        return { id: res.id, referenceId, status: 'sent' };
      }
    } catch (err) {
      console.warn('[emergencyAssistant] Online SOS dispatch failed, falling back to offline queue:', err);
    }
  }

  // Enqueue offline if offline or failed
  enqueueSosReport(
    {
      id: referenceId,
      client_id: referenceId,
      title: payload.title,
      category: payload.category,
      severity: payload.severity,
      description: payload.description,
      lat: params.lat,
      lng: params.lng,
      zone_id: payload.zone_id,
      reporter_id: reporterId || 'usr-guest',
    },
    reporterId || 'usr-guest'
  );

  return { id: referenceId, referenceId, status: 'queued' };
}

export interface AssistantEmergencyState {
  step: 'idle' | 'awaiting_emergency_location' | 'awaiting_emergency_confirmation' | 'awaiting_shelter_location';
  statedLocation?: string;
  coordinates?: { lat: number; lng: number };
  emergencyDescription?: string;
  pendingShelterSearch?: boolean;
}

/**
 * Fulfills shelter request using real backend shelter data.
 */
export async function executeShelterFlow(
  cleanMsg: string,
  language: LanguageCode,
  effectiveLocationName: string | undefined,
  effectiveCoords: { lat: number; lng: number } | null | undefined,
  getBrowserLocation: () => Promise<{ lat: number; lng: number } | null>
): Promise<{
  reply: string;
  nextState: AssistantEmergencyState;
  handled: boolean;
}> {
  if (effectiveCoords) {
    const nearestResult = await findNearestSafeShelter(effectiveCoords.lat, effectiveCoords.lng);
    if (nearestResult) {
      const { shelter, distanceKm, availableBeds } = nearestResult;
      const locName = effectiveLocationName || 'your location';
      let reply = '';
      if (language === 'hi') {
        reply = `${shelter.name} आपके स्थान (${locName}) के लिए सबसे नजदीकी उपयुक्त आश्रय है (लगभग ${distanceKm} किमी)। इसमें ${availableBeds}/${shelter.capacity} बेड उपलब्ध हैं और यह खुला है।`;
      } else if (language === 'ka') {
        reply = `${shelter.name} ನಿಮ್ಮ ಸ್ಥಳಕ್ಕೆ (${locName}) ಹತ್ತಿರದ ಸೂಕ್ತ ಆಶ್ರಯ ತಾಣವಾಗಿದೆ (ಸುಮಾರು ${distanceKm} ಕಿಮೀ). ಇದರಲ್ಲಿ ${availableBeds}/${shelter.capacity} ಬೆಡ್‌ಗಳು ಲಭ್ಯವಿವೆ.`;
      } else {
        reply = `${shelter.name} is the closest suitable shelter I found for ${locName}, approximately ${distanceKm} km away. It currently has ${availableBeds} beds available (${shelter.current_occupancy}/${shelter.capacity} occupied) and is open and accessible.`;
      }
      return {
        reply,
        nextState: { step: 'idle', statedLocation: locName, coordinates: effectiveCoords },
        handled: true,
      };
    }
  }

  // Try browser location
  const autoCoords = await getBrowserLocation();
  if (autoCoords) {
    const nearestResult = await findNearestSafeShelter(autoCoords.lat, autoCoords.lng);
    if (nearestResult) {
      const { shelter, distanceKm, availableBeds } = nearestResult;
      let reply = '';
      if (language === 'hi') {
        reply = `${shelter.name} आपके वर्तमान GPS स्थान से सबसे नजदीकी उपयुक्त आश्रय है (लगभग ${distanceKm} किमी)। इसमें ${availableBeds}/${shelter.capacity} बेड उपलब्ध हैं और यह खुला है।`;
      } else if (language === 'ka') {
        reply = `${shelter.name} ನಿಮ್ಮ ಪ್ರಸ್ತುತ GPS ಸ್ಥಳದಿಂದ ಹತ್ತಿರದ ಸೂಕ್ತ ಆಶ್ರಯ ತಾಣವಾಗಿದೆ (ಸುಮಾರು ${distanceKm} ಕಿಮೀ). ಇದರಲ್ಲಿ ${availableBeds}/${shelter.capacity} ಬೆಡ್‌ಗಳು ಲಭ್ಯವಿವೆ.`;
      } else {
        reply = `${shelter.name} is the closest suitable shelter I found for your location, approximately ${distanceKm} km away. It currently has ${availableBeds} beds available (${shelter.current_occupancy}/${shelter.capacity} occupied) and is open and accessible.`;
      }
      return {
        reply,
        nextState: { step: 'idle', statedLocation: 'Current GPS Location', coordinates: autoCoords },
        handled: true,
      };
    }
  }

  // If city is mentioned without coordinates, ask for area
  if (effectiveLocationName) {
    let reply = '';
    if (language === 'hi') {
      reply = `मैं आपके लिए आश्रय चेक कर सकता हूँ। आप वर्तमान में ${effectiveLocationName} के किस इलाके या लैंडमार्क में हैं?`;
    } else if (language === 'ka') {
      reply = `ನಾನು ನಿಮಗಾಗಿ ಆಶ್ರಯ ತಾಣವನ್ನು ಪರಿಶೀಲಿಸುತ್ತೇನೆ. ನೀವು ಪ್ರಸ್ತುತ ${effectiveLocationName} ನ ಯಾವ ಪ್ರದೇಶದಲ್ಲಿದ್ದೀರಿ?`;
    } else {
      reply = `I can check that for you. What area or landmark in ${effectiveLocationName} are you currently in?`;
    }
    return {
      reply,
      nextState: { step: 'awaiting_shelter_location', statedLocation: effectiveLocationName, pendingShelterSearch: true },
      handled: true,
    };
  }

  let reply = '';
  if (language === 'hi') {
    reply = `मैं बिना लॉगिन के सुरक्षित आश्रय चेक कर सकता हूँ। क्या मैं आपकी GPS लोकेशन का उपयोग करूँ, या कृपया अपना शहर और इलाका बताएं?`;
  } else if (language === 'ka') {
    reply = `ನಾನು ಲಾಗಿನ್ ಇಲ್ಲದೆಯೇ ಸುರಕ್ಷಿತ ಆಶ್ರಯ ತಾಣಗಳನ್ನು ಹುಡುಕಬಲ್ಲೆ. ನಾನು ನಿಮ್ಮ GPS ಲೊಕೇಶನ್ ಬಳಸಲೆ, ಅಥವಾ ನಿಮ್ಮ ನಗರ ಮತ್ತು ಪ್ರದೇಶ ತಿಳಿಸಿ?`;
  } else {
    reply = `I can check safe shelters for you without login. Can I use your current GPS location, or tell me your city and area?`;
  }
  return {
    reply,
    nextState: { step: 'awaiting_shelter_location', pendingShelterSearch: true },
    handled: true,
  };
}

/**
 * Fulfills alert request using real backend alert data.
 */
export async function executeAlertsFlow(
  language: LanguageCode,
  effectiveLocationName?: string,
  effectiveCoords?: { lat: number; lng: number } | null
): Promise<{
  reply: string;
  nextState: AssistantEmergencyState;
  handled: boolean;
}> {
  try {
    const alerts = await getAlerts();
    if (!alerts || alerts.length === 0) {
      let reply = '';
      if (language === 'hi') {
        reply = 'वर्तमान में आपके क्षेत्र के लिए कोई सक्रिय आपदा चेतावनी जारी नहीं की गई है। सतर्क रहें और जरूरत पड़ने पर मुझसे सहायता लें।';
      } else if (language === 'ka') {
        reply = 'ಪ್ರಸ್ತುತ ಯಾವುದೇ ಸಕ್ರಿಯ ವಿಪತ್ತು ಎಚ್ಚರಿಕೆಗಳು ದಾಖಲಾಗಿಲ್ಲ. ಜಾಗರೂಕರಾಗಿರಿ ಮತ್ತು ಅಗತ್ಯವಿದ್ದಲ್ಲಿ ಸಹಾಯ ಕೇಳಿ.';
      } else {
        reply = 'There are currently no active severe disaster alerts broadcast for this area. Stay vigilant, and let me know if you need shelter guidance or emergency assistance.';
      }
      return {
        reply,
        nextState: { step: 'idle', statedLocation: effectiveLocationName, coordinates: effectiveCoords || undefined },
        handled: true,
      };
    }

    const activeAlertSummaries = alerts.slice(0, 3).map((a) => {
      const msg =
        (a.message_translated && a.message_translated[language]) ||
        a.message_translated?.en ||
        a.message_en ||
        'Emergency Alert';
      return `• [${a.severity.toUpperCase()}] ${msg}`;
    });

    let reply = '';
    if (language === 'hi') {
      reply = `सक्रिय आपातकालीन अलर्ट:\n${activeAlertSummaries.join('\n')}\n\nयदि आप खतरे में हैं तो मुझे तुरंत बताएं।`;
    } else if (language === 'ka') {
      reply = `ಸಕ್ರಿಯ ತುರ್ತು ಎಚ್ಚರಿಕೆಗಳು:\n${activeAlertSummaries.join('\n')}\n\nನೀವು ಅಪಾಯದಲ್ಲಿದ್ದರೆ ತಕ್ಷಣ ನನಗೆ ತಿಳಿಸಿ.`;
    } else {
      reply = `Active Emergency Alerts:\n${activeAlertSummaries.join('\n')}\n\nIf you are in immediate danger, let me know right away so I can assist.`;
    }

    return {
      reply,
      nextState: { step: 'idle', statedLocation: effectiveLocationName, coordinates: effectiveCoords || undefined },
      handled: true,
    };
  } catch {
    return {
      reply: 'Unable to load active disaster alerts at this moment.',
      nextState: { step: 'idle', statedLocation: effectiveLocationName, coordinates: effectiveCoords || undefined },
      handled: true,
    };
  }
}

/**
 * Core Emergency Conversational Engine for the Sarvam Crisis Assistant.
 * Intercepts emergency, shelter, and alert intents and fulfills them with real data.
 */
export async function handleEmergencyConversation(
  message: string,
  language: LanguageCode,
  currentState: AssistantEmergencyState,
  browserCoordinates: { lat: number; lng: number } | null,
  getBrowserLocation: () => Promise<{ lat: number; lng: number } | null>
): Promise<{
  reply: string;
  nextState: AssistantEmergencyState;
  handled: boolean;
}> {
  const cleanMsg = message.trim();
  if (!cleanMsg) {
    return { reply: '', nextState: currentState, handled: false };
  }

  // 1. Extract any mentioned location to maintain context
  const extractedLoc = extractLocationFromText(cleanMsg);
  const effectiveLocationName = extractedLoc?.locationName || currentState.statedLocation;
  const effectiveCoords = extractedLoc
    ? { lat: extractedLoc.lat, lng: extractedLoc.lng }
    : currentState.coordinates || browserCoordinates;

  const isEmergency = detectEmergencyIntent(cleanMsg);
  const isShelter = detectShelterQuery(cleanMsg);
  const isAlerts = detectAlertsQuery(cleanMsg);
  const isAffirmative = detectAffirmative(cleanMsg);
  const isNegative = detectNegative(cleanMsg);

  // -------------------------------------------------------------
  // FLOW A: User was awaiting SOS confirmation
  // -------------------------------------------------------------
  if (currentState.step === 'awaiting_emergency_confirmation') {
    // 1. User intent overrides confirmation: User asks for Shelter (e.g. "no, just tell me any shelter" or "where is the nearest shelter?")
    if (isShelter) {
      return executeShelterFlow(cleanMsg, language, effectiveLocationName, effectiveCoords, getBrowserLocation);
    }

    // 2. User intent overrides confirmation: User asks for Alerts (e.g. "no, any active alerts?" or "are there flood warnings?")
    if (isAlerts) {
      return executeAlertsFlow(language, effectiveLocationName, effectiveCoords);
    }

    // 3. Explicit negative response cancels SOS (e.g. "no", "cancel", "don't send", "not now", "stop", "yes, don't send it")
    if (isNegative) {
      const reply =
        language === 'hi'
          ? 'ठीक है, आपातकालीन रिपोर्ट रद्द कर दी गई है। अगर आपको किसी भी समय सहायता या आश्रय की आवश्यकता हो तो मुझे बताएं।'
          : language === 'ka'
          ? 'ಸರಿ, ತುರ್ತು ವರದಿಯನ್ನು ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ. ನಿಮಗೆ ಯಾವುದೇ ಸಮಯದಲ್ಲಿ ಸಹಾಯ ಅಥವಾ ಆಶ್ರಯ ಬೇಕಾದರೆ ತಿಳಿಸಿ.'
          : 'Understood, emergency distress report has been cancelled. Let me know if you need safe shelter information or immediate assistance at any time.';
      return {
        reply,
        nextState: { step: 'idle', statedLocation: effectiveLocationName, coordinates: effectiveCoords || undefined },
        handled: true,
      };
    }

    // 4. If message is NOT an affirmative confirmation (e.g. general question "what about Bangalore?" or "how do I login?"),
    // clear the pending confirmation and pass through to general assistant
    if (!isAffirmative) {
      return {
        reply: '',
        nextState: { step: 'idle', statedLocation: effectiveLocationName, coordinates: effectiveCoords || undefined },
        handled: false,
      };
    }

    // 5. User gave explicit affirmative confirmation ("yes", "send help", "dispatch it", "haan", etc.)
    let targetCoords = effectiveCoords;
    let targetLocationName = effectiveLocationName || 'Current Location';

    if (!targetCoords) {
      targetCoords = await getBrowserLocation();
      if (targetCoords) {
        targetLocationName = 'Current GPS Location';
      }
    }

    if (!targetCoords) {
      const reply =
        language === 'hi'
          ? 'मैं आपकी GPS लोकेशन तक नहीं पहुंच सका। कृपया अपना क्षेत्र या लैंडमार्क (जैसे "व्हाइटफील्ड, बैंगलोर") टाइप करें ताकि मैं रिपोर्ट भेज सकूं।'
          : language === 'ka'
          ? 'ನನಗೆ ನಿಮ್ಮ GPS ಲೊಕೇಶನ್ ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪ್ರದೇಶ ಅಥವಾ ಲ್ಯಾಂಡ್‌ಮಾರ್ಕ್ (ಉದಾ: "ವೈಟ್‌ಫೀಲ್ಡ್, ಬೆಂಗಳೂರು") ತಿಳಿಸಿ.'
          : "I can't access your GPS. Tell me your area or landmark (for example: \"Whitefield, Bangalore\") so I can include your location in the distress report.";
      return {
        reply,
        nextState: {
          step: 'awaiting_emergency_location',
          statedLocation: effectiveLocationName,
          coordinates: effectiveCoords || undefined,
          emergencyDescription: currentState.emergencyDescription,
        },
        handled: true,
      };
    }

    // Submit real incident to backend
    const result = await submitEmergencyIncident({
      description: currentState.emergencyDescription || cleanMsg,
      lat: targetCoords.lat,
      lng: targetCoords.lng,
      locationName: targetLocationName,
    });

    // Also look up nearest shelter
    let nearestInfoStr = '';
    try {
      const nearest = await findNearestSafeShelter(targetCoords.lat, targetCoords.lng);
      if (nearest) {
        if (language === 'hi') {
          nearestInfoStr = ` सबसे नजदीकी सुरक्षित आश्रय: ${nearest.shelter.name} (${nearest.distanceKm} किमी, ${nearest.availableBeds} बेड उपलब्ध)।`;
        } else if (language === 'ka') {
          nearestInfoStr = ` ಹತ್ತಿರದ ಸುರಕ್ಷಿತ ಆಶ್ರಯ: ${nearest.shelter.name} (${nearest.distanceKm} ಕಿಮೀ, ${nearest.availableBeds} ಬೆಡ್‌ಗಳು ಲಭ್ಯ).`;
        } else {
          nearestInfoStr = ` Nearest safe shelter: ${nearest.shelter.name} (${nearest.distanceKm} km away, ${nearest.availableBeds} beds available).`;
        }
      }
    } catch {
      // Ignore shelter lookup error during emergency
    }

    let reply = '';
    if (language === 'hi') {
      reply = `आपकी आपातकालीन संकट रिपोर्ट (Ref ID: ${result.referenceId}) भेज दी गई है। स्थान: ${targetLocationName}। कृपया किसी ऊंचे और सुरक्षित स्थान पर रहें और बहते पानी में न जाएं।${nearestInfoStr} बचाव दल को सूचित कर दिया गया है।`;
    } else if (language === 'ka') {
      reply = `ನಿಮ್ಮ ತುರ್ತು ವರದಿ (Ref ID: ${result.referenceId}) ಯಶಸ್ವಿಯಾಗಿ ಕಳುಹಿಸಲಾಗಿದೆ. ಸ್ಥಳ: ${targetLocationName}. ದಯವಿಟ್ಟು ಎತ್ತರದ ಸ್ಥಳದಲ್ಲೇ ಇರಿ ಮತ್ತು ಹರಿಯುವ ನೀರಿನಲ್ಲಿ ಚಲಿಸಬೇಡಿ.${nearestInfoStr} ರಕ್ಷಣಾ ತಂಡಗಳಿಗೆ ಮಾಹಿತಿ ನೀಡಲಾಗಿದೆ.`;
    } else {
      reply = `Your distress report has been sent (Ref ID: ${result.referenceId}). Location: ${targetLocationName}. Stay somewhere elevated, stay calm, and avoid moving through floodwater.${nearestInfoStr} Emergency responders have been alerted.`;
    }

    return {
      reply,
      nextState: {
        step: 'idle',
        statedLocation: targetLocationName,
        coordinates: targetCoords,
      },
      handled: true,
    };
  }

  // -------------------------------------------------------------
  // FLOW B: User was awaiting emergency location
  // -------------------------------------------------------------
  if (currentState.step === 'awaiting_emergency_location') {
    // 1. User overrides with Shelter query
    if (isShelter) {
      return executeShelterFlow(cleanMsg, language, effectiveLocationName, effectiveCoords, getBrowserLocation);
    }

    // 2. User overrides with Alerts query
    if (isAlerts) {
      return executeAlertsFlow(language, effectiveLocationName, effectiveCoords);
    }

    // 3. User cancels
    if (isNegative) {
      const reply =
        language === 'hi'
          ? 'ठीक है, आपातकालीन रिपोर्ट रद्द कर दी गई है। अगर आपको किसी भी समय सहायता या आश्रय की आवश्यकता हो तो मुझे बताएं।'
          : language === 'ka'
          ? 'ಸರಿ, ತುರ್ತು ವರದಿಯನ್ನು ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ. ನಿಮಗೆ ಯಾವುದೇ ಸಮಯದಲ್ಲಿ ಸಹಾಯ ಅಥವಾ ಆಶ್ರಯ ಬೇಕಾದರೆ ತಿಳಿಸಿ.'
          : 'Understood, emergency distress report has been cancelled. Let me know if you need safe shelter information or immediate assistance at any time.';
      return {
        reply,
        nextState: { step: 'idle', statedLocation: effectiveLocationName, coordinates: effectiveCoords || undefined },
        handled: true,
      };
    }

    // 4. User provides a recognizable location or confirms browser location
    let targetCoords = effectiveCoords;
    let targetLocationName = effectiveLocationName;

    if (isAffirmative && !targetCoords) {
      targetCoords = await getBrowserLocation();
      if (targetCoords) {
        targetLocationName = 'Current GPS Location';
      }
    }

    if (targetCoords) {
      const result = await submitEmergencyIncident({
        description: currentState.emergencyDescription || cleanMsg,
        lat: targetCoords.lat,
        lng: targetCoords.lng,
        locationName: targetLocationName || 'Stated Location',
      });

      let nearestInfoStr = '';
      try {
        const nearest = await findNearestSafeShelter(targetCoords.lat, targetCoords.lng);
        if (nearest) {
          if (language === 'hi') {
            nearestInfoStr = ` सबसे नजदीकी सुरक्षित आश्रय: ${nearest.shelter.name} (${nearest.distanceKm} किमी, ${nearest.availableBeds} बेड उपलब्ध)।`;
          } else if (language === 'ka') {
            nearestInfoStr = ` ಹತ್ತಿರದ ಸುರಕ್ಷಿತ ಆಶ್ರಯ: ${nearest.shelter.name} (${nearest.distanceKm} ಕಿಮೀ, ${nearest.availableBeds} ಬೆಡ್‌ಗಳು ಲಭ್ಯ).`;
          } else {
            nearestInfoStr = ` Nearest safe shelter: ${nearest.shelter.name} (${nearest.distanceKm} km away, ${nearest.availableBeds} beds available).`;
          }
        }
      } catch {
        // Ignore shelter lookup error
      }

      let reply = '';
      if (language === 'hi') {
        reply = `आपकी आपातकालीन संकट रिपोर्ट (Ref ID: ${result.referenceId}) भेज दी गई है। स्थान: ${targetLocationName}। कृपया किसी ऊंचे और सुरक्षित स्थान पर रहें।${nearestInfoStr} बचाव दल को सूचित कर दिया गया है।`;
      } else if (language === 'ka') {
        reply = `ನಿಮ್ಮ ತುರ್ತು ವರದಿ (Ref ID: ${result.referenceId}) ಯಶಸ್ವಿಯಾಗಿ ಕಳುಹಿಸಲಾಗಿದೆ. ಸ್ಥಳ: ${targetLocationName}. ದಯವಿಟ್ಟು ಎತ್ತರದ ಸ್ಥಳದಲ್ಲೇ ಇರಿ.${nearestInfoStr} ರಕ್ಷಣಾ ತಂಡಗಳಿಗೆ ಮಾಹಿತಿ ನೀಡಲಾಗಿದೆ.`;
      } else {
        reply = `Your distress report has been sent (Ref ID: ${result.referenceId}). Location: ${targetLocationName}. Stay somewhere elevated, stay calm, and avoid moving through floodwater.${nearestInfoStr} Emergency responders have been alerted.`;
      }

      return {
        reply,
        nextState: {
          step: 'idle',
          statedLocation: targetLocationName,
          coordinates: targetCoords,
        },
        handled: true,
      };
    }

    // Location could not be resolved from text or GPS
    const reply =
      language === 'hi'
        ? 'मुझे आपकी लोकेशन नहीं मिली। कृपया अपने शहर या इलाके का नाम बताएं (जैसे "बैंगलोर" या "सिल्चर") ताकि मैं आपकी संकट रिपोर्ट भेज सकूं।'
        : language === 'ka'
        ? 'ನಿಮ್ಮ ಲೊಕೇಶನ್ ಸಿಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ನಗರ ಅಥವಾ ಪ್ರದೇಶದ ಹೆಸರು ತಿಳಿಸಿ (ಉದಾ: "ಬೆಂಗಳೂರು" ಅಥವಾ "ಸಿಲ್ಚಾರ್").'
        : "I couldn't identify that location. Please tell me your city or area name (for example: \"Bangalore\" or \"Silchar\") so I can dispatch your rescue report.";
    return {
      reply,
      nextState: {
        step: 'awaiting_emergency_location',
        statedLocation: effectiveLocationName,
        coordinates: undefined,
        emergencyDescription: currentState.emergencyDescription,
      },
      handled: true,
    };
  }

  // -------------------------------------------------------------
  // FLOW B2: User is in the middle of a shelter query workflow
  // -------------------------------------------------------------
  if (currentState.step === 'awaiting_shelter_location' || (currentState.pendingShelterSearch && extractedLoc)) {
    return executeShelterFlow(cleanMsg, language, effectiveLocationName, effectiveCoords, getBrowserLocation);
  }

  // -------------------------------------------------------------
  // FLOW C: New Immediate Danger / Distress Trigger
  // -------------------------------------------------------------
  if (isEmergency) {
    // Check if location is already known (either extracted from this message, prior context, or GPS available)
    if (effectiveCoords) {
      const locName = effectiveLocationName || 'your current location';
      let reply = '';
      if (language === 'hi') {
        reply = `आप आपात स्थिति में हैं। मैं बिना लॉगिन के आपातकालीन संकट रिपोर्ट दर्ज कर सकता हूँ। क्या मैं ${locName} के लिए अभी आपकी संकट रिपोर्ट भेज दूँ? ("हाँ" कहें)`;
      } else if (language === 'ka') {
        reply = `ನೀವು ತುರ್ತು ಪರಿಸ್ಥಿತಿಯಲ್ಲಿದ್ದೀರಿ. ನಾನು ಲಾಗಿನ್ ಇಲ್ಲದೆಯೇ ತುರ್ತು ವರದಿಯನ್ನು ಕಳುಹಿಸಬಹುದು. ನಾನು ${locName} ಗಾಗಿ ಈಗಲೇ ವರದಿ ಕಳುಹಿಸಲೆ? ("ಹೌದು" ಎಂದು ಉತ್ತರಿಸಿ)`;
      } else {
        reply = `You're in an emergency. I can send a distress report without login. Can I use ${locName} to dispatch your rescue report now?`;
      }

      return {
        reply,
        nextState: {
          step: 'awaiting_emergency_confirmation',
          statedLocation: effectiveLocationName,
          coordinates: effectiveCoords,
          emergencyDescription: cleanMsg,
        },
        handled: true,
      };
    }

    // Try silently fetching browser coordinates if permission is already granted
    const autoCoords = await getBrowserLocation();
    if (autoCoords) {
      let reply = '';
      if (language === 'hi') {
        reply = `आप आपात स्थिति में हैं। मैं बिना लॉगिन के आपातकालीन रिपोर्ट भेज सकता हूँ। क्या मैं आपके वर्तमान GPS स्थान का उपयोग करके संकट रिपोर्ट भेज दूँ?`;
      } else if (language === 'ka') {
        reply = `ನೀವು ತುರ್ತು ಪರಿಸ್ಥಿತಿಯಲ್ಲಿದ್ದೀರಿ. ನಾನು ಲಾಗಿನ್ ಇಲ್ಲದೆಯೇ ವರದಿ ಕಳುಹಿಸಬಹುದು. ನಿಮ್ಮ ಪ್ರಸ್ತುತ GPS ಸ್ಥಳವನ್ನು ಬಳಸಿ ವರದಿ ಕಳುಹಿಸಲೆ?`;
      } else {
        reply = `You're in an emergency. I can send a distress report without login. Can I use your current GPS location to send the report?`;
      }

      return {
        reply,
        nextState: {
          step: 'awaiting_emergency_confirmation',
          statedLocation: 'Current GPS Location',
          coordinates: autoCoords,
          emergencyDescription: cleanMsg,
        },
        handled: true,
      };
    }

    // Location not available yet, prompt user conversationally
    let reply = '';
    if (language === 'hi') {
      reply = `आप आपात स्थिति में हैं। मैं बिना लॉगिन के सहायता करूँगा। संकट रिपोर्ट भेजने के लिए मुझे आपकी लोकेशन चाहिए। क्या मैं आपकी वर्तमान लोकेशन का उपयोग करूँ, या कृपया अपना शहर और इलाका बताएं?`;
    } else if (language === 'ka') {
      reply = `ನೀವು ತುರ್ತು ಪರಿಸ್ಥಿತಿಯಲ್ಲಿದ್ದೀರಿ. ಲಾಗಿನ್ ಇಲ್ಲದೆಯೇ ನಾನು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. ವರದಿ ಕಳುಹಿಸಲು ನಿಮ್ಮ ಲೊಕೇಶನ್ ಬೇಕು. ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಲೊಕೇಶನ್ ಬಳಸಲೆ, ಅಥವಾ ನಿಮ್ಮ ಪ್ರದೇಶ ತಿಳಿಸಿ?`;
    } else {
      reply = `You're in an emergency. I'll help you report it without login. I need your location to send the distress report. Can I use your current location, or tell me your area and city?`;
    }

    return {
      reply,
      nextState: {
        step: 'awaiting_emergency_location',
        statedLocation: effectiveLocationName,
        coordinates: undefined,
        emergencyDescription: cleanMsg,
      },
      handled: true,
    };
  }

  // -------------------------------------------------------------
  // FLOW D: New Shelter Query Trigger
  // -------------------------------------------------------------
  if (isShelter) {
    return executeShelterFlow(cleanMsg, language, effectiveLocationName, effectiveCoords, getBrowserLocation);
  }

  // -------------------------------------------------------------
  // FLOW E: Active Disaster Alerts Trigger
  // -------------------------------------------------------------
  if (isAlerts) {
    return executeAlertsFlow(language, effectiveLocationName, effectiveCoords);
  }

  // If user simply states a location in conversation e.g. "I'm in Bangalore" or "Whitefield"
  if (extractedLoc) {
    return {
      reply: '',
      nextState: {
        ...currentState,
        statedLocation: extractedLoc.locationName,
        coordinates: { lat: extractedLoc.lat, lng: extractedLoc.lng },
      },
      handled: false,
    };
  }

  // Not an emergency/shelter/alert flow -> fall back to general Sarvam LLM
  return {
    reply: '',
    nextState: currentState,
    handled: false,
  };
}
