import React, { createContext, useContext, useState } from 'react';
import { User, Incident, Shelter, IncidentCategory, SeverityLevel, IncidentStatus } from '@/types';
import { mockUsers, mockIncidents, mockShelters } from '@/mocks';

export type LanguageCode = 'en' | 'hi' | 'ta';

export interface NewIncidentPayload {
  title: string;
  description: string;
  category: IncidentCategory;
  severity?: SeverityLevel;
  lat?: number;
  lng?: number;
  location_name?: string;
  photo?: File | null;
  has_voice_note?: boolean;
}

interface CitizenContextType {
  user: User;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  incidents: Incident[];
  activeIncident: Incident | null;
  shelters: Shelter[];
  addIncident: (payload: NewIncidentPayload) => Incident;
  getNearestShelter: (lat?: number, lng?: number) => Shelter;
}

const CitizenContext = createContext<CitizenContextType | undefined>(undefined);

export const CitizenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user] = useState<User>(mockUsers.find((u) => u.role === 'citizen') || mockUsers[0]);
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [incidents, setIncidents] = useState<Incident[]>(mockIncidents);
  const [activeIncident, setActiveIncident] = useState<Incident | null>(mockIncidents[0] || null);

  const addIncident = (payload: NewIncidentPayload): Incident => {
    const newId = `inc-${Date.now().toString().slice(-4)}`;
    const newIncident: Incident = {
      id: newId,
      title: payload.title || `Emergency SOS: ${payload.category.toUpperCase()}`,
      description: payload.description || 'Immediate emergency rescue assistance requested.',
      category: payload.category,
      severity: payload.severity || 'critical',
      status: 'reported',
      lat: payload.lat || 28.625,
      lng: payload.lng || 77.125,
      reported_by_user_id: user.id,
      zone_id: user.zone_id || 'zone-north-01',
      created_at: new Date().toISOString(),
    };

    setIncidents((prev) => [newIncident, ...prev]);
    setActiveIncident(newIncident);
    return newIncident;
  };

  const getNearestShelter = (lat?: number, lng?: number): Shelter => {
    const openShelters = mockShelters.filter((s) => s.status === 'open');
    if (openShelters.length > 0) {
      return openShelters[0];
    }
    return mockShelters[0];
  };

  return (
    <CitizenContext.Provider
      value={{
        user,
        language,
        setLanguage,
        incidents,
        activeIncident,
        shelters: mockShelters,
        addIncident,
        getNearestShelter,
      }}
    >
      {children}
    </CitizenContext.Provider>
  );
};

export const useCitizenContext = (): CitizenContextType => {
  const context = useContext(CitizenContext);
  if (!context) {
    throw new Error('useCitizenContext must be used within a CitizenProvider');
  }
  return context;
};
