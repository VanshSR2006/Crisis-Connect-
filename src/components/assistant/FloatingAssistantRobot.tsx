import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { VoiceAssistantWidget } from './VoiceAssistantWidget';
import { RobotAvatar, AssistantState } from './RobotAvatar';

export const FloatingAssistantRobot: React.FC = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [assistantState, setAssistantState] = useState<AssistantState>('idle');

  const toggleWidget = () => {
    setIsOpen((prev) => !prev);
  };

  const isListening = assistantState === 'listening';
  const isSpeaking = assistantState === 'speaking';
  const isThinking = assistantState === 'thinking';

  return (
    <>
      {/* Floating Chat Widget */}
      <VoiceAssistantWidget
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        assistantState={assistantState}
        onStateChange={setAssistantState}
      />

      {/* Floating AI Action Button — Classy Monochrome Style */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={toggleWidget}
          aria-expanded={isOpen}
          aria-label={isOpen ? t('assistant.close') : t('assistant.open')}
          className={`group relative flex items-center justify-center p-3.5 rounded-full shadow-xl shadow-slate-900/30 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
            isListening
              ? 'bg-rose-600 text-white shadow-rose-600/30 scale-105'
              : 'bg-[#0f172a] hover:bg-slate-900 text-white border border-slate-800 hover:scale-105 active:scale-95'
          }`}
        >
          {/* Classy Telegram-inspired Avatar */}
          <RobotAvatar state={assistantState} size="lg" />

          {/* Minimalist Status Dot */}
          <span className="absolute top-0 right-0 flex h-3 w-3">
            {isListening ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-90" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border-2 border-white" />
              </>
            ) : isSpeaking ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-80" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-900 border-2 border-white" />
              </>
            ) : isThinking ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-80" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-600 border-2 border-white" />
              </>
            ) : (
              <>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white" />
              </>
            )}
          </span>
        </button>
      </div>
    </>
  );
};

