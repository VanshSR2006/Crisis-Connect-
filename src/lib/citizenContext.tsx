import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Incident, Shelter, IncidentCategory, SeverityLevel, IncidentStatus } from '../types';
import { mockUsers, mockIncidents, mockShelters } from '../mocks';
import { useLanguage } from './languageContext';
import type { LanguageCode } from './i18n';
import { getIncidents } from './api/incidents';
import { realtimeClient } from './api/websocket';

export type { LanguageCode };

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
  updateIncidentStatus: (incidentId: string, status: IncidentStatus) => void;
  getNearestShelter: (lat?: number, lng?: number) => Shelter;
  setZoneId: (zoneId: string) => void;
  refreshIncidents: () => Promise<void>;
}

const CitizenContext = createContext<CitizenContextType | undefined>(undefined);

export const CitizenProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(mockUsers.find((u) => u.role === 'citizen') || mockUsers[0]);
  const [incidents, setIncidents] = useState<Incident[]>(mockIncidents);
  const [activeIncident, setActiveIncident] = useState<Incident | null>(mockIncidents[0] || null);

  const { language, setLanguage } = useLanguage();

  const refreshIncidents = useCallback(async () => {
    try {
      const backendList = await getIncidents();
      if (backendList && backendList.length > 0) {
        setIncidents(backendList);
        // Maintain active incident reference or pick the latest reported
        setActiveIncident((prev) => {
          if (!prev) return backendList[0];
          const updatedActive = backendList.find((i) => i.id === prev.id);
          return updatedActive || prev;
        });
      }
    } catch (err) {
      console.warn('[CitizenContext] Error fetching live incidents:', err);
    }
  }, []);

  useEffect(() => {
    refreshIncidents();

    // Subscribe to WebSocket realtime status events
    const unsubCreated = realtimeClient.subscribe('incident.created', () => refreshIncidents());
    const unsubUpdated = realtimeClient.subscribe('incident.updated', (payload: any) => {
      if (payload && payload.id) {
        setIncidents((prev) =>
          prev.map((i) => (i.id === payload.id ? { ...i, status: payload.status || i.status } : i))
        );
        setActiveIncident((prev) => {
          if (prev && prev.id === payload.id) {
            return { ...prev, status: payload.status || prev.status };
          }
          return prev;
        });
      } else {
        refreshIncidents();
      }
    });

    const unsubDispatchStatus = realtimeClient.subscribe('dispatch.status_changed', (payload: any) => {
      if (payload && payload.incident_id) {
        let mappedStatus: IncidentStatus = 'dispatched';
        if (payload.status === 'on_site' || payload.status === 'arrived') {
          mappedStatus = 'arrived';
        } else if (payload.status === 'completed' || payload.status === 'resolved') {
          mappedStatus = 'resolved';
        }

        setIncidents((prev) =>
          prev.map((i) => (i.id === payload.incident_id ? { ...i, status: mappedStatus } : i))
        );
        setActiveIncident((prev) => {
          if (prev && prev.id === payload.incident_id) {
            return { ...prev, status: mappedStatus };
          }
          return prev;
        });
      } else {
        refreshIncidents();
      }
    });

    return () => {
      unsubCreated();
      unsubUpdated();
      unsubDispatchStatus();
    };
  }, [refreshIncidents]);

  const updateIncidentStatus = (incidentId: string, status: IncidentStatus) => {
    setIncidents((prev) =>
      prev.map((i) => (i.id === incidentId ? { ...i, status } : i))
    );
    setActiveIncident((prev) => (prev?.id === incidentId ? { ...prev, status } : prev));
  };

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
      reporter_id: user.id,
      zone_id: user.zone_id || 'z-silchar',
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
        updateIncidentStatus,
        getNearestShelter,
        setZoneId: (zoneId: string) => setUser((prev) => ({ ...prev, zone_id: zoneId })),
        refreshIncidents,
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
