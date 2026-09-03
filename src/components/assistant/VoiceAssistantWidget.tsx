import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Send, Sparkles, AlertCircle, Mic, Square, Volume2, VolumeX, RefreshCw } from 'lucide-react';
import { askAiAssistant, speechToText, textToSpeech } from '@/lib/api/ai';
import { useLanguage } from '@/lib/languageContext';
import { RobotAvatar, AssistantState } from './RobotAvatar';
import { convertBlobToWav } from '@/lib/audioRecorder';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  isError?: boolean;
  audioBase64?: string;
}

export interface VoiceAssistantWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  assistantState?: AssistantState;
  onStateChange?: (state: AssistantState) => void;
}

export const VoiceAssistantWidget: React.FC<VoiceAssistantWidgetProps> = ({
  isOpen,
  onClose,
  assistantState = 'idle',
  onStateChange,
}) => {
  const { t } = useTranslation();
  const { language } = useLanguage();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [internalState, setInternalState] = useState<AssistantState>('idle');
  const [micNotice, setMicNotice] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);

  const activeState = assistantState || internalState;

  const updateState = (newState: AssistantState) => {
    setInternalState(newState);
    onStateChange?.(newState);
  };

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Audio recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<number | null>(null);

  // Audio playback ref
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Stop any ongoing speech playback
  const stopSpeaking = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    if (activeState === 'speaking') {
      updateState('idle');
    }
  };

  // Play audio from base64 string
  const playAudio = (audioBase64: string, contentType: string = 'audio/wav') => {
    stopSpeaking();
    try {
      const audioUrl = `data:${contentType};base64,${audioBase64}`;
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      updateState('speaking');

      audio.onended = () => {
        currentAudioRef.current = null;
        updateState('idle');
      };

      audio.onerror = () => {
        console.warn('[VoiceAssistantWidget] Audio playback error.');
        currentAudioRef.current = null;
        updateState('idle');
      };

      audio.play().catch((err) => {
        console.warn('[VoiceAssistantWidget] Audio play was prevented or failed:', err);
        currentAudioRef.current = null;
        updateState('idle');
      });
    } catch (err) {
      console.warn('[VoiceAssistantWidget] Failed to initialize Audio:', err);
      updateState('idle');
    }
  };

  // Synthesize and play TTS audio for text
  const speakText = async (text: string, messageId?: string) => {
    try {
      const ttsData = await textToSpeech(text, language);
      if (ttsData && ttsData.audio_base64) {
        if (messageId) {
          setMessages((prev) =>
            prev.map((m) => (m.id === messageId ? { ...m, audioBase64: ttsData.audio_base64 } : m))
          );
        }
        playAudio(ttsData.audio_base64, ttsData.content_type || 'audio/wav');
      } else {
        console.info('[VoiceAssistantWidget] TTS response unavailable.');
        updateState('idle');
      }
    } catch (err) {
      console.warn('[VoiceAssistantWidget] TTS playback error:', err);
      updateState('idle');
    }
  };

  // Cleanup audio tracks and timer
  const cleanupRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setRecordingDuration(0);

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    mediaRecorderRef.current = null;
  };

  // Stop recording explicitly
  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  // Start safe browser microphone recording on explicit user click
  const startListening = async () => {
    stopSpeaking();
    setMicNotice(null);

    // Check browser MediaRecorder and getUserMedia support
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      setMicNotice(t('assistant.micDenied'));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      // Determine supported MIME type
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const rawBlob = new Blob(audioChunksRef.current, { type: mimeType });
        cleanupRecording();

        if (rawBlob.size === 0) {
          updateState('idle');
          return;
        }

        // Process Speech to Text via Sarvam Saaras v3
        updateState('thinking');

        try {
          // Convert browser audio to clean 16kHz WAV for pristine Saaras v3 transcription
          const wavBlob = await convertBlobToWav(rawBlob);
          const sttResult = await speechToText(wavBlob, language);

          if (!sttResult || !sttResult.transcript || !sttResult.transcript.trim()) {
            const errorMessage: Message = {
              id: `error-stt-${Date.now()}`,
              role: 'assistant',
              content: t('assistant.sttError'),
              isError: true,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages((prev) => [...prev, errorMessage]);
            updateState('idle');
            return;
          }

          const recognizedText = sttResult.transcript.trim();

          // Show recognized user speech in the chat stream
          const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: recognizedText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages((prev) => [...prev, userMessage]);

          // Send recognized transcript to Sarvam AI (sarvam-105b-conversations)
          const aiResponse = await askAiAssistant(recognizedText, language);

          if (aiResponse && aiResponse.response) {
            // User requested audio-only reply for voice queries: synthesize and speak directly without displaying text reply
            await speakText(aiResponse.response);
          } else {
            const errorMessage: Message = {
              id: `error-ai-${Date.now()}`,
              role: 'assistant',
              content: t('assistant.aiError'),
              isError: true,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages((prev) => [...prev, errorMessage]);
            updateState('idle');
          }
        } catch (sttErr) {
          console.warn('[VoiceAssistantWidget] STT error:', sttErr);
          const errorMessage: Message = {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: t('assistant.sttError'),
            isError: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages((prev) => [...prev, errorMessage]);
          updateState('idle');
        }
      };

      recorder.start(250); // collect 250ms chunks
      updateState('listening');
      setRecordingDuration(0);

      recordingTimerRef.current = window.setInterval(() => {
        setRecordingDuration((sec) => {
          // Auto stop after 20 seconds to prevent runaway recording
          if (sec >= 20) {
            stopListening();
            return sec;
          }
          return sec + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.warn('[VoiceAssistantWidget] Microphone access denied or failed:', err);
      cleanupRecording();
      updateState('idle');
      setMicNotice(t('assistant.micDenied'));
    }
  };

  // Initialize greeting on first render or language switch
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 0 || (prev.length === 1 && prev[0].role === 'assistant')) {
        return [
          {
            id: 'initial-greeting',
            role: 'assistant',
            content: t('assistant.welcome'),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ];
      }
      return prev;
    });
  }, [language, t]);

  // Focus input and scroll to bottom when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      stopSpeaking();
      stopListening();
    }
  }, [isOpen]);

  // Clean up recording and speech on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      cleanupRecording();
    };
  }, []);

  // Auto-scroll when messages change or state changes
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeState, isOpen]);

  const handleSend = async (customMessage?: string) => {
    const messageToSend = (customMessage || input).trim();
    if (!messageToSend || activeState === 'listening' || activeState === 'thinking') return;

    stopSpeaking();
    setMicNotice(null);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customMessage) {
      setInput('');
    }
    updateState('thinking');

    try {
      const response = await askAiAssistant(messageToSend, language);

      if (response && response.response) {
        const assistantMsgId = `assistant-${Date.now()}`;
        const assistantMessage: Message = {
          id: assistantMsgId,
          role: 'assistant',
          content: response.response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        updateState('idle');
      } else {
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: t('assistant.aiError'),
          isError: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, errorMessage]);
        updateState('idle');
      }
    } catch (err) {
      console.warn('[VoiceAssistantWidget] AI response failed:', err);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: t('assistant.aiError'),
        isError: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
      updateState('idle');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  const isListening = activeState === 'listening';
  const isThinking = activeState === 'thinking';
  const isSpeaking = activeState === 'speaking';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('assistant.title')}
      className="fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 max-w-sm sm:max-w-md h-[560px] max-h-[80vh] bg-white text-slate-900 rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-900/15 z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
    >
      {/* Header — Website Tone (#0f172a) Design */}
      <div className="px-4 py-3.5 bg-[#0f172a] text-white flex items-center justify-between border-b border-[#1e293b] shadow-sm">
        <div className="flex items-center gap-3">
          {/* Avatar Badge */}
          <RobotAvatar state={activeState} size="sm" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight text-white font-sans">
                {t('assistant.title')}
              </h3>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-medium mt-0.5">
              {isListening ? (
                <span className="text-rose-400 flex items-center gap-1 font-mono">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-ping"></span>
                  {t('assistant.listening')} ({recordingDuration}s)
                </span>
              ) : isSpeaking ? (
                <span className="text-cyan-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                  {t('assistant.speaking')}
                </span>
              ) : isThinking ? (
                <span className="text-slate-300 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300 animate-bounce"></span>
                  {t('assistant.thinking')}
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                  {t('assistant.online')}
                </span>
              )}
              <span className="text-slate-400 font-mono text-[10px] uppercase">
                ({language})
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isSpeaking && (
            <button
              type="button"
              onClick={stopSpeaking}
              aria-label={t('assistant.stopSpeaking')}
              title={t('assistant.stopSpeaking')}
              className="px-2.5 py-1 bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 rounded-xl transition-colors cursor-pointer border border-slate-700 flex items-center gap-1.5 text-[11px] font-medium"
            >
              <VolumeX className="h-3.5 w-3.5 text-slate-300" />
              <span className="hidden sm:inline">{t('assistant.stopSpeaking')}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label={t('assistant.close')}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mic Warning / Notice Banner */}
      {micNotice && (
        <div className="bg-amber-50 border-b border-amber-200 px-3.5 py-2 flex items-start gap-2 text-amber-900 text-xs">
          <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="flex-1 leading-snug">{micNotice}</p>
          <button
            type="button"
            onClick={() => setMicNotice(null)}
            className="text-amber-700 hover:text-amber-900 text-xs font-semibold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Messages Scroll Area — Pure Clean Minimalist Cards */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/60">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="flex-shrink-0 mt-0.5">
                <RobotAvatar state="idle" size="sm" />
              </div>
            )}

            <div
              className={`max-w-[84%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                msg.role === 'user'
                  ? 'bg-slate-900 text-white rounded-tr-xs font-medium'
                  : msg.isError
                  ? 'bg-amber-50 text-amber-900 border border-amber-200 rounded-tl-xs'
                  : 'bg-white text-slate-900 border border-slate-200/90 rounded-tl-xs shadow-xs'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>

              <div className="flex items-center justify-between mt-2 gap-2 border-t border-slate-100 pt-1.5">
                {msg.timestamp && (
                  <p
                    className={`text-[9px] font-mono ${
                      msg.role === 'user' ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </p>
                )}

                {/* Speak button for assistant message replay */}
                {msg.role === 'assistant' && !msg.isError && (
                  <button
                    type="button"
                    onClick={() => {
                      if (msg.audioBase64) {
                        playAudio(msg.audioBase64);
                      } else {
                        speakText(msg.content, msg.id);
                      }
                    }}
                    title={t('assistant.playVoice')}
                    className="text-slate-500 hover:text-slate-900 p-1 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-medium"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>Replay</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Dynamic Voice Activity Visualizers — Clean Monochrome */}
        {isListening && (
          <div className="flex items-start gap-2.5 justify-start">
            <RobotAvatar state="listening" size="sm" />
            <div className="bg-rose-50 border border-rose-200 rounded-2xl rounded-tl-xs px-3.5 py-2.5 text-xs text-rose-900 flex items-center gap-3 shadow-xs w-full max-w-[84%]">
              <div className="flex items-center space-x-1">
                <span className="h-3 w-1 bg-rose-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="h-4 w-1 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="h-5 w-1 bg-rose-600 rounded-full animate-bounce" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-rose-900">{t('assistant.listening')}</p>
                <p className="text-[10px] text-rose-600 font-mono">{recordingDuration}s</p>
              </div>
            </div>
          </div>
        )}

        {isThinking && (
          <div className="flex items-start gap-2.5 justify-start">
            <RobotAvatar state="thinking" size="sm" />
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs px-3.5 py-2.5 text-xs text-slate-700 flex items-center gap-3 shadow-xs w-full max-w-[84%]">
              <span className="font-medium text-slate-800">{t('assistant.thinking')}</span>
              <div className="flex space-x-1.5 items-center">
                <span className="h-2 w-2 bg-slate-900 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="h-2 w-2 bg-slate-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}

        {isSpeaking && (
          <div className="flex items-start gap-2.5 justify-start">
            <RobotAvatar state="speaking" size="sm" />
            <div className="bg-slate-100 border border-slate-200 rounded-2xl rounded-tl-xs px-3.5 py-2.5 text-xs text-slate-900 flex items-center justify-between gap-3 shadow-xs w-full max-w-[84%]">
              <div className="flex items-center gap-2.5">
                <Volume2 className="h-4 w-4 text-slate-800 animate-pulse" />
                <div>
                  <p className="font-semibold text-slate-900">{t('assistant.speaking')}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={stopSpeaking}
                className="text-[10px] bg-white hover:bg-slate-200 text-slate-900 font-medium px-2.5 py-1 rounded-lg transition-colors border border-slate-300 shadow-2xs"
              >
                {t('assistant.stopSpeaking')}
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input & Voice Controls Area — Floating White Pill Input */}
      <div className="p-3 bg-white border-t border-slate-100">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 bg-slate-100 border border-slate-200 focus-within:border-slate-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-900/10 rounded-full p-1.5 transition-all"
        >
          {/* Microphone Action Button */}
          {isListening ? (
            <button
              type="button"
              onClick={stopListening}
              aria-label={t('assistant.stopListening')}
              title={t('assistant.stopListening')}
              className="p-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full active:scale-95 transition-all duration-150 cursor-pointer shadow-xs animate-pulse flex items-center justify-center"
            >
              <Square className="h-4 w-4 fill-white" />
            </button>
          ) : (
            <button
              type="button"
              onClick={startListening}
              disabled={isThinking}
              aria-label={t('assistant.startListening')}
              title={t('assistant.startListening')}
              className="p-2.5 bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-full active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer flex items-center justify-center shadow-2xs"
            >
              <Mic className="h-4 w-4" />
            </button>
          )}

          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isListening || isThinking}
            placeholder={
              isListening
                ? `${t('assistant.listening')} (${recordingDuration}s)`
                : t('assistant.placeholder')
            }
            className="flex-1 px-3 py-1.5 bg-transparent border-none text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none disabled:opacity-50 transition-all font-sans"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!input.trim() || isListening || isThinking}
            aria-label={t('assistant.send')}
            className="p-2.5 bg-slate-900 hover:bg-black active:scale-95 text-white rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer shadow-xs flex items-center justify-center"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

