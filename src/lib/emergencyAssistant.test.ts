import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  detectEmergencyIntent,
  detectShelterQuery,
  detectAlertsQuery,
  detectAffirmative,
  detectNegative,
  extractLocationFromText,
  calculateDistanceKm,
  findNearestSafeShelter,
  handleEmergencyConversation,
  AssistantEmergencyState,
} from './emergencyAssistant';
import * as sheltersApi from './api/shelters';
import * as alertsApi from './api/alerts';
import * as incidentsApi from './api/incidents';
import { Shelter, Alert } from '@/types';

const mockShelters: Shelter[] = [
  {
    id: 'shelter-bengaluru-1',
    name: 'Bengaluru Central Relief Pavilion',
    location_name: 'Bengaluru Central Relief Pavilion',
    lat: 12.9716,
    lng: 77.5946,
    capacity: 1100,
    current_occupancy: 180,
    status: 'open',
    contact_number: '',
    zone_id: 'z-bengaluru',
  },
  {
    id: 'shelter-delhi-1',
    name: 'Delhi NCR Disaster Evacuation Center',
    location_name: 'Delhi NCR Disaster Evacuation Center',
    lat: 28.6139,
    lng: 77.2090,
    capacity: 1200,
    current_occupancy: 350,
    status: 'open',
    contact_number: '',
    zone_id: 'z-delhi',
  },
  {
    id: 'shelter-silchar-1',
    name: 'Silchar District Relief Camp',
    location_name: 'Silchar District Relief Camp',
    lat: 24.8250,
    lng: 92.7950,
    capacity: 500,
    current_occupancy: 150,
    status: 'open',
    contact_number: '',
    zone_id: 'z-silchar',
  },
];

const mockAlerts: Alert[] = [
  {
    id: 'alert-1',
    zone_id: 'z-silchar',
    message_en: 'Severe flash flood alert for Barak river basin.',
    message_translated: {
      en: 'Severe flash flood alert for Barak river basin.',
      hi: 'बराक नदी बेसिन के लिए गंभीर अचानक बाढ़ की चेतावनी।',
      ka: 'ಬರಾಕ್ ನದಿ ಜಲಾನಯನ ಪ್ರದೇಶಕ್ಕೆ ತೀವ್ರ ಹಠಾತ್ ಪ್ರವಾಹ ಎಚ್ಚರಿಕೆ.',
    },
    severity: 'critical',
    issued_at: '2026-09-04T12:00:00Z',
  },
];

describe('Emergency Intent Detection', () => {
  it('detects immediate danger phrases in English', () => {
    expect(detectEmergencyIntent("I'm in danger")).toBe(true);
    expect(detectEmergencyIntent("I'm trapped")).toBe(true);
    expect(detectEmergencyIntent('water is rising')).toBe(true);
    expect(detectEmergencyIntent('I need rescue')).toBe(true);
    expect(detectEmergencyIntent('there is a flood here')).toBe(true);
    expect(detectEmergencyIntent("I'm stuck in Bangalore")).toBe(true);
    expect(detectEmergencyIntent("help me, I'm drowning")).toBe(true);
    expect(detectEmergencyIntent('send rescue')).toBe(true);
    expect(detectEmergencyIntent('send help')).toBe(true);
  });

  it('detects emergency phrases in Hindi', () => {
    expect(detectEmergencyIntent('mujhe help chahiye')).toBe(true);
    expect(detectEmergencyIntent('main phas gaya hoon')).toBe(true);
    expect(detectEmergencyIntent('paani badh raha hai')).toBe(true);
    expect(detectEmergencyIntent('flood aa gaya')).toBe(true);
    expect(detectEmergencyIntent('मुझे बचाओ पानी भर गया है')).toBe(true);
  });

  it('detects emergency phrases in Kannada', () => {
    expect(detectEmergencyIntent('ನನಗೆ ಸಹಾಯ ಬೇಕು')).toBe(true);
    expect(detectEmergencyIntent('ಸಿಲುಕಿಕೊಂಡಿದ್ದೇನೆ')).toBe(true);
    expect(detectEmergencyIntent('neeru hecchagide')).toBe(true);
  });

  it('returns false for non-emergency queries', () => {
    expect(detectEmergencyIntent('What is Crisis Connect?')).toBe(false);
    expect(detectEmergencyIntent('How do I switch languages?')).toBe(false);
  });
});

describe('Shelter and Alerts Query Detection', () => {
  it('detects shelter inquiries in English, Hindi, Kannada', () => {
    expect(detectShelterQuery("I'm in Bangalore, what's the nearest safest shelter for me?")).toBe(true);
    expect(detectShelterQuery('nearest safe shelter?')).toBe(true);
    expect(detectShelterQuery('where can I go')).toBe(true);
    expect(detectShelterQuery('mujhe nearest shelter batao')).toBe(true);
    expect(detectShelterQuery('ಹತ್ತಿರದ ಸುರಕ್ಷಿತ ಆಶ್ರಯ ತಾಣ ಯಾವುದು?')).toBe(true);
  });

  it('detects alerts inquiries in English, Hindi, Kannada', () => {
    expect(detectAlertsQuery('any alerts?')).toBe(true);
    expect(detectAlertsQuery('is Bangalore under warning?')).toBe(true);
    expect(detectAlertsQuery('what disasters are active?')).toBe(true);
    expect(detectAlertsQuery('flood alerts?')).toBe(true);
    expect(detectAlertsQuery('कोई सक्रिय चेतावनी है?')).toBe(true);
    expect(detectAlertsQuery('ಪ್ರವಾಹ ಎಚ್ಚರಿಕೆ ಇದೆಯೇ?')).toBe(true);
  });
});

describe('Location Extraction and Distance', () => {
  it('extracts recognized cities from natural language', () => {
    const locBangalore = extractLocationFromText("I'm trapped in Bangalore, water is rising.");
    expect(locBangalore).not.toBeNull();
    expect(locBangalore?.locationName).toBe('Bangalore');

    const locWhitefield = extractLocationFromText('I am near Whitefield');
    expect(locWhitefield).not.toBeNull();
    expect(locWhitefield?.locationName).toContain('Whitefield');

    const locSilchar = extractLocationFromText('silchar flood emergency');
    expect(locSilchar).not.toBeNull();
    expect(locSilchar?.locationName).toBe('Silchar');
  });

  it('calculates accurate Haversine distance in km', () => {
    // Whitefield to Bangalore center (~17 km)
    const dist = calculateDistanceKm(12.9698, 77.75, 12.9716, 77.5946);
    expect(dist).toBeGreaterThan(15);
    expect(dist).toBeLessThan(20);
  });

  it('finds nearest safe shelter from backend data', async () => {
    vi.spyOn(sheltersApi, 'getShelters').mockResolvedValue(mockShelters);

    // Incident near Bengaluru
    const nearest = await findNearestSafeShelter(12.9716, 77.5946);
    expect(nearest).not.toBeNull();
    expect(nearest?.shelter.name).toBe('Bengaluru Central Relief Pavilion');
    expect(nearest?.availableBeds).toBe(920);
  });
});

describe('handleEmergencyConversation flow without login', () => {
  beforeEach(() => {
    vi.spyOn(sheltersApi, 'getShelters').mockResolvedValue(mockShelters);
    vi.spyOn(alertsApi, 'getAlerts').mockResolvedValue(mockAlerts);
    vi.spyOn(incidentsApi, 'createIncident').mockResolvedValue({
      id: 'inc-test-123',
      title: 'Emergency SOS Report',
      category: 'rescue',
      severity: 'critical',
      description: 'Test emergency',
      lat: 12.9716,
      lng: 77.5946,
      zone_id: 'z-silchar',
      reporter_id: null,
      status: 'reported',
      priority_score: 85,
      credibility_score: 1.0,
      review_state: 'unverified',
      created_at: new Date().toISOString(),
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('handles shelter question with city in natural language using real backend data', async () => {
    const initialState: AssistantEmergencyState = { step: 'idle' };
    const result = await handleEmergencyConversation(
      "I'm in Bangalore, what's the nearest safest shelter for me?",
      'en',
      initialState,
      null,
      async () => null
    );

    expect(result.handled).toBe(true);
    expect(result.reply).toContain('Bengaluru Central Relief Pavilion');
    expect(result.reply).toContain('beds available');
    expect(result.reply).toContain('open and accessible');
    expect(result.reply).not.toContain('login');
  });

  it('handles immediate danger without location by asking for location conversationally', async () => {
    const initialState: AssistantEmergencyState = { step: 'idle' };
    const result = await handleEmergencyConversation(
      "I'm in danger",
      'en',
      initialState,
      null,
      async () => null
    );

    expect(result.handled).toBe(true);
    expect(result.reply).toContain("You're in an emergency");
    expect(result.reply).toContain('without login');
    expect(result.reply).toContain('location');
    expect(result.nextState.step).toBe('awaiting_emergency_location');
  });

  it('creates backend incident when user confirms emergency and provides location', async () => {
    const pendingState: AssistantEmergencyState = {
      step: 'awaiting_emergency_location',
      emergencyDescription: 'water is rising fast',
    };

    const result = await handleEmergencyConversation(
      'Whitefield, Bangalore',
      'en',
      pendingState,
      null,
      async () => null
    );

    expect(result.handled).toBe(true);
    expect(result.reply).toContain('distress report has been sent');
    expect(result.reply).toContain('Ref ID:');
    expect(result.reply).toContain('Bengaluru Central Relief Pavilion');
    expect(incidentsApi.createIncident).toHaveBeenCalled();
  });

  it('maintains multi-turn context when user mentions city first, then reports danger', async () => {
    // Step 1: User says location
    const step1 = await handleEmergencyConversation(
      "I'm in Bangalore",
      'en',
      { step: 'idle' },
      null,
      async () => null
    );
    expect(step1.nextState.statedLocation).toBe('Bangalore');

    // Step 2: User says in danger -> assistant reuses Bangalore context
    const step2 = await handleEmergencyConversation(
      "Water is rising and I'm trapped",
      'en',
      step1.nextState,
      null,
      async () => null
    );
    expect(step2.handled).toBe(true);
    expect(step2.reply).toContain('Bangalore');
    expect(step2.nextState.step).toBe('awaiting_emergency_confirmation');

    // Step 3: User confirms "yes" -> incident created for Bangalore
    const step3 = await handleEmergencyConversation(
      'yes',
      'en',
      step2.nextState,
      null,
      async () => null
    );
    expect(step3.handled).toBe(true);
    expect(step3.reply).toContain('distress report has been sent');
    expect(incidentsApi.createIncident).toHaveBeenCalled();
  });

  it('answers active alerts questions with real backend alerts data', async () => {
    const result = await handleEmergencyConversation(
      'any active flood alerts?',
      'en',
      { step: 'idle' },
      null,
      async () => null
    );

    expect(result.handled).toBe(true);
    expect(result.reply).toContain('Severe flash flood alert for Barak river basin');
  });
});
