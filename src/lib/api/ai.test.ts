import { describe, it, expect, vi, beforeEach } from 'vitest';
import { askAiAssistant, speechToText, textToSpeech, AI_ENDPOINTS } from './ai';
import * as clientModule from './client';

describe('AI_ENDPOINTS', () => {
  it('has precise route paths matching FastAPI backend router', () => {
    expect(AI_ENDPOINTS.ASSISTANT).toBe('/ai/assistant');
    expect(AI_ENDPOINTS.SPEECH_TO_TEXT).toBe('/ai/speech-to-text');
    expect(AI_ENDPOINTS.TEXT_TO_SPEECH).toBe('/ai/text-to-speech');
  });
});

describe('askAiAssistant', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns response when apiFetch succeeds', async () => {
    const mockResponse = { response: 'Crisis Connect is an emergency platform.' };
    vi.spyOn(clientModule, 'apiFetch').mockResolvedValue(mockResponse);

    const result = await askAiAssistant('What is Crisis Connect?', 'en');
    expect(result).toEqual(mockResponse);
    expect(clientModule.apiFetch).toHaveBeenCalledWith('/ai/assistant', {
      method: 'POST',
      body: JSON.stringify({
        message: 'What is Crisis Connect?',
        language: 'en',
      }),
    });
  });

  it('handles Hindi language requests', async () => {
    const mockResponse = { response: 'क्राइसिस कनेक्ट एक आपदा प्रतिक्रिया प्रणाली है।' };
    vi.spyOn(clientModule, 'apiFetch').mockResolvedValue(mockResponse);

    const result = await askAiAssistant('Crisis Connect क्या है?', 'hi');
    expect(result).toEqual(mockResponse);
    expect(clientModule.apiFetch).toHaveBeenCalledWith('/ai/assistant', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Crisis Connect क्या है?',
        language: 'hi',
      }),
    });
  });

  it('handles Kannada language requests and auto-detects Kannada script', async () => {
    const mockResponse = { response: 'ಕ್ರೈಸಿಸ್ ಕನೆಕ್ಟ್ ಒಂದು ತುರ್ತು ಪ್ರತಿಕ್ರಿಯೆ ವೇದಿಕೆಯಾಗಿದೆ.' };
    vi.spyOn(clientModule, 'apiFetch').mockResolvedValue(mockResponse);

    const result = await askAiAssistant('ಕ್ರೈಸಿಸ್ ಕನೆಕ್ಟ್ ಎಂದರೇನು?', 'en');
    expect(result).toEqual(mockResponse);
    expect(clientModule.apiFetch).toHaveBeenCalledWith('/ai/assistant', {
      method: 'POST',
      body: JSON.stringify({
        message: 'ಕ್ರೈಸಿಸ್ ಕನೆಕ್ಟ್ ಎಂದರೇನು?',
        language: 'ka',
      }),
    });
  });

  it('returns null when message is empty or whitespace', async () => {
    const apiSpy = vi.spyOn(clientModule, 'apiFetch');
    const result = await askAiAssistant('   ', 'en');
    expect(result).toBeNull();
    expect(apiSpy).not.toHaveBeenCalled();
  });

  it('returns null when apiFetch returns null (network error)', async () => {
    vi.spyOn(clientModule, 'apiFetch').mockResolvedValue(null);

    const result = await askAiAssistant('Help me', 'en');
    expect(result).toBeNull();
  });
});

describe('speechToText', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('uploads audio blob and returns transcript', async () => {
    const mockResponse = { transcript: 'How does SOS work?', language_code: 'en-IN' };
    vi.spyOn(clientModule, 'apiFetch').mockResolvedValue(mockResponse);

    const blob = new Blob(['audio-data'], { type: 'audio/webm' });
    const result = await speechToText(blob, 'en');

    expect(result).toEqual(mockResponse);
    expect(clientModule.apiFetch).toHaveBeenCalledWith(
      '/ai/speech-to-text',
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('returns null for empty blob', async () => {
    const blob = new Blob([], { type: 'audio/webm' });
    const result = await speechToText(blob);
    expect(result).toBeNull();
  });
});

describe('textToSpeech', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('synthesizes text to speech audio', async () => {
    const mockResponse = { audio_base64: 'UklGRfake', content_type: 'audio/wav' };
    vi.spyOn(clientModule, 'apiFetch').mockResolvedValue(mockResponse);

    const result = await textToSpeech('Welcome to Crisis Connect', 'en');
    expect(result).toEqual(mockResponse);
    expect(clientModule.apiFetch).toHaveBeenCalledWith('/ai/text-to-speech', {
      method: 'POST',
      body: JSON.stringify({
        text: 'Welcome to Crisis Connect',
        language: 'en',
        speaker: 'shubh',
      }),
    });
  });

  it('returns null for empty text', async () => {
    const result = await textToSpeech('   ', 'en');
    expect(result).toBeNull();
  });
});
