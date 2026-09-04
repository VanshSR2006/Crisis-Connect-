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

describe('Affirmative and Negative Intent Detection', () => {
  it('identifies affirmative confirmations', () => {
    expect(detectAffirmative('yes')).toBe(true);
    expect(detectAffirmative('yeah')).toBe(true);
    expect(detectAffirmative('yes please')).toBe(true);
    expect(detectAffirmative('send it')).toBe(true);
    expect(detectAffirmative('send help')).toBe(true);
    expect(detectAffirmative('dispatch')).toBe(true);
    expect(detectAffirmative('do it')).toBe(true);
    expect(detectAffirmative('okay send')).toBe(true);
    expect(detectAffirmative('haan')).toBe(true);
    expect(detectAffirmative('haan bhejo')).toBe(true);
    expect(detectAffirmative('हाँ')).toBe(true);
    expect(detectAffirmative('ಹೌದು')).toBe(true);
    expect(detectAffirmative('yes, send help')).toBe(true);
  });

  it('rejects ambiguous or negated phrases from affirmative detection', () => {
    expect(detectAffirmative('no')).toBe(false);
    expect(detectAffirmative('no thanks')).toBe(false);
    expect(detectAffirmative('no just tell me a shelter')).toBe(false);
    expect(detectAffirmative('not now')).toBe(false);
    expect(detectAffirmative('I only need a shelter')).toBe(false);
    expect(detectAffirmative('where is the nearest shelter?')).toBe(false);
    expect(detectAffirmative('tell me the shelter')).toBe(false);
    expect(detectAffirmative('what about Bangalore?')).toBe(false);
    expect(detectAffirmative('cancel')).toBe(false);
    expect(detectAffirmative("don't send")).toBe(false);
    expect(detectAffirmative('stop')).toBe(false);
    expect(detectAffirmative("yes, don't send it")).toBe(false);
  });

  it('identifies negative responses', () => {
    expect(detectNegative('no')).toBe(true);
    expect(detectNegative('no thanks')).toBe(true);
    expect(detectNegative('no just tell me any shelter')).toBe(true);
    expect(detectNegative('not now')).toBe(true);
    expect(detectNegative('cancel')).toBe(true);
    expect(detectNegative("don't send")).toBe(true);
    expect(detectNegative('stop')).toBe(true);
    expect(detectNegative('nahi')).toBe(true);
    expect(detectNegative('mat bhejo')).toBe(true);
    expect(detectNegative('beda')).toBe(true);
  });
});

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
    expect(detectShelterQuery('no just tell me any shelter')).toBe(true);
  });

  it('detects alerts inquiries in English, Hindi, Kannada', () => {
    expect(detectAlertsQuery('any alerts?')).toBe(true);
    expect(detectAlertsQuery('is Bangalore under warning?')).toBe(true);
    expect(detectAlertsQuery('what disasters are active?')).toBe(true);
    expect(detectAlertsQuery('flood alerts?')).toBe(true);
    expect(detectAlertsQuery('कोई सक्रिय चेतावनी है?')).toBe(true);
    expect(detectAlertsQuery('ಪ್ರವಾಹ ಎಚ್ಚರಿಕೆ ಇದೆಯೇ?')).toBe(true);
    expect(detectAlertsQuery('no, are there any flood alerts?')).toBe(true);
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

describe('Emergency Confirmation State Machine — All 9 Required Scenarios', () => {
  let createIncidentSpy: any;

  beforeEach(() => {
    vi.spyOn(sheltersApi, 'getShelters').mockResolvedValue(mockShelters);
    vi.spyOn(alertsApi, 'getAlerts').mockResolvedValue(mockAlerts);
    createIncidentSpy = vi.spyOn(incidentsApi, 'createIncident').mockResolvedValue({
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

  // Scenario 1: Emergency -> "yes" -> incident created
  it('Scenario 1: Emergency -> "yes" -> incident created', async () => {
    const pendingState: AssistantEmergencyState = {
      step: 'awaiting_emergency_confirmation',
      statedLocation: 'Bangalore',
      coordinates: { lat: 12.9716, lng: 77.5946 },
      emergencyDescription: "I'm trapped in Bangalore",
    };

    const res = await handleEmergencyConversation('yes', 'en', pendingState, null, async () => null);

    expect(res.handled).toBe(true);
    expect(res.reply).toContain('distress report has been sent');
    expect(res.reply).toContain('Ref ID:');
    expect(createIncidentSpy).toHaveBeenCalledTimes(1);
    expect(res.nextState.step).toBe('idle');
  });

  // Scenario 2: Emergency -> "no" -> incident NOT created
  it('Scenario 2: Emergency -> "no" -> incident NOT created', async () => {
    const pendingState: AssistantEmergencyState = {
      step: 'awaiting_emergency_confirmation',
      statedLocation: 'Bangalore',
      coordinates: { lat: 12.9716, lng: 77.5946 },
      emergencyDescription: "I'm trapped in Bangalore",
    };

    const res = await handleEmergencyConversation('no', 'en', pendingState, null, async () => null);

    expect(res.handled).toBe(true);
    expect(res.reply).toContain('cancelled');
    expect(createIncidentSpy).not.toHaveBeenCalled();
    expect(res.nextState.step).toBe('idle');
  });

  // Scenario 3: Emergency -> "no, just tell me a shelter" -> shelter lookup, NO incident
  it('Scenario 3: Emergency -> "no, just tell me a shelter" -> shelter lookup, NO incident', async () => {
    const pendingState: AssistantEmergencyState = {
      step: 'awaiting_emergency_confirmation',
      statedLocation: 'Bangalore',
      coordinates: { lat: 12.9716, lng: 77.5946 },
      emergencyDescription: "I'm trapped in Bangalore",
    };

    const res = await handleEmergencyConversation(
      'no, just tell me a shelter',
      'en',
      pendingState,
      null,
      async () => null
    );

    expect(res.handled).toBe(true);
    expect(res.reply).toContain('Bengaluru Central Relief Pavilion');
    expect(res.reply).toContain('beds available');
    expect(createIncidentSpy).not.toHaveBeenCalled();
    expect(res.nextState.step).toBe('idle');
  });

  // Scenario 4: Emergency -> "no, any active alerts?" -> alerts lookup, NO incident
  it('Scenario 4: Emergency -> "no, any active alerts?" -> alerts lookup, NO incident', async () => {
    const pendingState: AssistantEmergencyState = {
      step: 'awaiting_emergency_confirmation',
      statedLocation: 'Bangalore',
      coordinates: { lat: 12.9716, lng: 77.5946 },
      emergencyDescription: "I'm trapped in Bangalore",
    };

    const res = await handleEmergencyConversation(
      'no, any active alerts?',
      'en',
      pendingState,
      null,
      async () => null
    );

    expect(res.handled).toBe(true);
    expect(res.reply).toContain('Severe flash flood alert for Barak river basin');
    expect(createIncidentSpy).not.toHaveBeenCalled();
    expect(res.nextState.step).toBe('idle');
  });

  // Scenario 5: Emergency -> "cancel" -> no incident
  it('Scenario 5: Emergency -> "cancel" -> no incident', async () => {
    const pendingState: AssistantEmergencyState = {
      step: 'awaiting_emergency_confirmation',
      statedLocation: 'Bangalore',
      coordinates: { lat: 12.9716, lng: 77.5946 },
      emergencyDescription: "I'm trapped in Bangalore",
    };

    const res = await handleEmergencyConversation('cancel', 'en', pendingState, null, async () => null);

    expect(res.handled).toBe(true);
    expect(res.reply).toContain('cancelled');
    expect(createIncidentSpy).not.toHaveBeenCalled();
    expect(res.nextState.step).toBe('idle');
  });

  // Scenario 6: Emergency -> "yes, send help" -> incident created
  it('Scenario 6: Emergency -> "yes, send help" -> incident created', async () => {
    const pendingState: AssistantEmergencyState = {
      step: 'awaiting_emergency_confirmation',
      statedLocation: 'Bangalore',
      coordinates: { lat: 12.9716, lng: 77.5946 },
      emergencyDescription: "I'm trapped in Bangalore",
    };

    const res = await handleEmergencyConversation(
      'yes, send help',
      'en',
      pendingState,
      null,
      async () => null
    );

    expect(res.handled).toBe(true);
    expect(res.reply).toContain('distress report has been sent');
    expect(res.reply).toContain('Ref ID:');
    expect(createIncidentSpy).toHaveBeenCalledTimes(1);
    expect(res.nextState.step).toBe('idle');
  });

  // Scenario 7: Emergency -> "yes, don't send it" -> NO incident
  it("Scenario 7: Emergency -> \"yes, don't send it\" -> NO incident", async () => {
    const pendingState: AssistantEmergencyState = {
      step: 'awaiting_emergency_confirmation',
      statedLocation: 'Bangalore',
      coordinates: { lat: 12.9716, lng: 77.5946 },
      emergencyDescription: "I'm trapped in Bangalore",
    };

    const res = await handleEmergencyConversation(
      "yes, don't send it",
      'en',
      pendingState,
      null,
      async () => null
    );

    // Negative phrase in message cancels or rejects SOS
    expect(createIncidentSpy).not.toHaveBeenCalled();
    expect(res.nextState.step).toBe('idle');
  });

  // Scenario 8: Multi-turn location context still works
  it('Scenario 8: Multi-turn location context still works', async () => {
    // Turn 1: User mentions location
    const step1 = await handleEmergencyConversation(
      "I'm in Bangalore",
      'en',
      { step: 'idle' },
      null,
      async () => null
    );
    expect(step1.nextState.statedLocation).toBe('Bangalore');

    // Turn 2: User says in danger -> prompt uses stored Bangalore context without dispatching yet
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
    expect(createIncidentSpy).not.toHaveBeenCalled(); // NO incident yet!

    // Turn 3: User confirms "yes" -> incident dispatched with stored Bangalore coordinates
    const step3 = await handleEmergencyConversation(
      'yes',
      'en',
      step2.nextState,
      null,
      async () => null
    );
    expect(step3.handled).toBe(true);
    expect(step3.reply).toContain('distress report has been sent');
    expect(createIncidentSpy).toHaveBeenCalledTimes(1);
    expect(step3.nextState.step).toBe('idle');
  });

  // Scenario 9: Repeated confirmation cannot create duplicate incidents
  it('Scenario 9: Repeated confirmation cannot create duplicate incidents', async () => {
    const pendingState: AssistantEmergencyState = {
      step: 'awaiting_emergency_confirmation',
      statedLocation: 'Bangalore',
      coordinates: { lat: 12.9716, lng: 77.5946 },
      emergencyDescription: "I'm trapped in Bangalore",
    };

    // First confirmation -> incident created, state becomes idle
    const firstConfirmation = await handleEmergencyConversation(
      'yes',
      'en',
      pendingState,
      null,
      async () => null
    );
    expect(firstConfirmation.handled).toBe(true);
    expect(createIncidentSpy).toHaveBeenCalledTimes(1);
    expect(firstConfirmation.nextState.step).toBe('idle');

    // Second repeated message with the new state (idle) -> does NOT call createIncident again
    const secondMessage = await handleEmergencyConversation(
      'yes',
      'en',
      firstConfirmation.nextState,
      null,
      async () => null
    );
    expect(createIncidentSpy).toHaveBeenCalledTimes(1); // STILL 1, no duplicate incident
    expect(secondMessage.handled).toBe(false);
  });
});
