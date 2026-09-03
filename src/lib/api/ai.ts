import { apiFetch } from './client';
import { LanguageCode } from '../languageContext';

export interface AiAssistantRequest {
  message: string;
  language: LanguageCode;
}

export interface AiAssistantResponse {
  response: string;
}

export interface SpeechToTextResponse {
  transcript: string;
  language_code?: string;
}

export interface TextToSpeechResponse {
  audio_base64: string;
  content_type: string;
}

export const AI_ENDPOINTS = {
  ASSISTANT: '/ai/assistant',
  SPEECH_TO_TEXT: '/ai/speech-to-text',
  TEXT_TO_SPEECH: '/ai/text-to-speech',
} as const;

/**
 * Detects whether message contains Devanagari (Hindi) or Kannada Unicode script
 * or standard transliterated keywords, falling back to the user's selected language.
 */
export function detectMessageLanguage(message: string, fallback: LanguageCode = 'en'): LanguageCode {
  if (!message) return fallback;
  for (let i = 0; i < message.length; i++) {
    const code = message.charCodeAt(i);
    if (code >= 0x0900 && code <= 0x097f) {
      return 'hi';
    }
    if (code >= 0x0c80 && code <= 0x0cff) {
      return 'ka';
    }
  }
  const lower = message.toLowerCase();
  if (/\b(kannada|kannadadalli|kannadalli|yenu|enu|hege|beku|namaskara|dhanyavada|dayavittu|yelli|elli|hogi|banni|aguthe|hosa|andre|andare|heli|yavaga)\b/.test(lower)) {
    return 'ka';
  }
  if (/\b(hindi|kya|kaise|batao|bataiye|madad|kripya|namaste|mujhe|chahiye|karna|karen|shukriya|dhanyawad|baare|samjhao|hain|hai|hota|hoti)\b/.test(lower)) {
    return 'hi';
  }
  return fallback;
}

/**
 * Sends a message to the secure backend AI assistant endpoint.
 * POST /ai/assistant
 * 
 * Returns typed response or null on network/server failure.
 * Does not expose secrets or stack traces to the caller.
 */
export async function askAiAssistant(
  message: string,
  language: LanguageCode = 'en'
): Promise<AiAssistantResponse | null> {
  const cleanMessage = message.trim();
  if (!cleanMessage) {
    return null;
  }

  const effectiveLanguage = detectMessageLanguage(cleanMessage, language);

  try {
    const data = await apiFetch<AiAssistantResponse>(AI_ENDPOINTS.ASSISTANT, {
      method: 'POST',
      body: JSON.stringify({
        message: cleanMessage,
        language: effectiveLanguage,
      }),
    });
    return data;
  } catch (err) {
    console.warn('[askAiAssistant] Failed to query AI assistant:', err);
    return null;
  }
}

/**
 * Sends recorded audio blob to backend Sarvam Saaras v3 speech-to-text.
 * POST /ai/speech-to-text
 */
export async function speechToText(
  audioBlob: Blob,
  language?: LanguageCode
): Promise<SpeechToTextResponse | null> {
  if (!audioBlob || audioBlob.size === 0) {
    return null;
  }

  const formData = new FormData();
  const filename = audioBlob.type.includes('wav') ? 'speech_recording.wav' : 'speech_recording.wav';
  formData.append('file', audioBlob, filename);
  if (language) {
    formData.append('language', language);
  }

  try {
    const data = await apiFetch<SpeechToTextResponse>(AI_ENDPOINTS.SPEECH_TO_TEXT, {
      method: 'POST',
      body: formData,
    });
    return data;
  } catch (err) {
    console.warn('[speechToText] Transcription failed:', err);
    return null;
  }
}

/**
 * Synthesizes text to speech using backend Sarvam Bulbul v3.
 * POST /ai/text-to-speech
 */
export async function textToSpeech(
  text: string,
  language: LanguageCode = 'en'
): Promise<TextToSpeechResponse | null> {
  const cleanText = text.trim();
  if (!cleanText) {
    return null;
  }

  const effectiveLanguage = detectMessageLanguage(cleanText, language);

  try {
    const data = await apiFetch<TextToSpeechResponse>(AI_ENDPOINTS.TEXT_TO_SPEECH, {
      method: 'POST',
      body: JSON.stringify({
        text: cleanText,
        language: effectiveLanguage,
        speaker: 'shubh',
      }),
    });
    return data;
  } catch (err) {
    console.warn('[textToSpeech] Voice synthesis failed:', err);
    return null;
  }
}

