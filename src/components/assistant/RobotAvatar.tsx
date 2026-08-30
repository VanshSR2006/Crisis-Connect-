import React from 'react';

export type AssistantState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface RobotAvatarProps {
  state?: AssistantState;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const RobotAvatar: React.FC<RobotAvatarProps> = ({
  state = 'idle',
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  };

  const currentSizeClass = sizeClasses[size];
  const currentIconSize = iconSizes[size];

  const isListening = state === 'listening';
  const isThinking = state === 'thinking';
  const isSpeaking = state === 'speaking';

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Subtle status pulse */}
      {isListening && (
        <span className="absolute -inset-1 rounded-full bg-rose-500/30 animate-ping pointer-events-none" />
      )}
      {isSpeaking && (
        <span className="absolute -inset-1 rounded-full bg-blue-500/20 animate-pulse pointer-events-none" />
      )}
      {isThinking && (
        <span className="absolute -inset-1 rounded-full bg-slate-400/20 animate-pulse pointer-events-none" />
      )}

      {/* Circle Badge in Website Tone (#0f172a slate-900) */}
      <div
        className={`relative z-10 flex items-center justify-center rounded-full bg-[#0f172a] text-white shadow-sm transition-all duration-200 ${currentSizeClass} ${
          isListening ? 'bg-rose-600 text-white' : ''
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${currentIconSize} transition-transform duration-200 ${
            isThinking ? 'animate-spin' : ''
          }`}
        >
          {isListening ? (
            /* Listening State: Microphone */
            <g fill="currentColor">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2h-2v2a9 9 0 0 0 8 8.94V22h2v-1.06A9 9 0 0 0 21 12v-2h-2z" />
            </g>
          ) : isThinking ? (
            /* Thinking State: Spinning dots / loader */
            <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
            </g>
          ) : isSpeaking ? (
            /* Speaking State: Audio wave inside bubble */
            <g fill="currentColor">
              <path d="M20 2H4C2.9 2 2 2.9 2 4V15C2 16.1 2.9 17 4 17H7.5L5.8 20.4C5.5 21 6 21.7 6.6 21.5L12 17H20C21.1 17 22 16.1 22 15V4C22 2.9 21.1 2 20 2Z" />
            </g>
          ) : (
            /* Idle: Exact Chat Bubble SVG matching user image */
            <path
              d="M20 2H4C2.9 2 2 2.9 2 4V15C2 16.1 2.9 17 4 17H7.5L5.8 20.4C5.5 21 6 21.7 6.6 21.5L12 17H20C21.1 17 22 16.1 22 15V4C22 2.9 21.1 2 20 2Z"
              fill="currentColor"
            />
          )}
        </svg>
      </div>
    </div>
  );
};



