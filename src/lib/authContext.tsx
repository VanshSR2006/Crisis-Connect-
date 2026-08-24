import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AuthSession } from '@/lib/auth';
import { getStoredSession, storeAuth } from '@/lib/auth';

interface AuthContextValue {
  session: AuthSession | null;
  isRestoring: boolean;
  setSession: (session: AuthSession) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Restores localStorage once at application startup.  Protected routes defer
 * their redirect until this restoration has completed.
 */
export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    setSessionState(getStoredSession());
    setIsRestoring(false);
  }, []);

  const setSession = (nextSession: AuthSession) => {
    storeAuth(nextSession);
    setSessionState(nextSession);
  };

  return (
    <AuthContext.Provider value={{ session, isRestoring, setSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
