import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Incident, Shelter, IncidentCategory, SeverityLevel, IncidentStatus } from '../types';
import { mockUsers, mockShelters } from '../mocks';
import { useLanguage } from './languageContext';
import type { LanguageCode } from './i18n';
import { getIncidents } from './api/incidents';
import { realtimeClient } from './api/websocket';
import { getStoredUser } from './auth';

/** Identifies SOS panic alerts submitted from the pre-login Emergency SOS button.
 *  These must never appear in the citizen home tracker. */
export const GUEST_SOS_DESCRIPTION = 'Emergency SOS — panic alert triggered from login page';


export type { LanguageCode };

export type GeoStatus = 'idle' | 'detecting' | 'acquired' | 'denied' | 'unavailable' | 'timeout';

function getAuthenticatedCitizenUser(): User {
  const stored = getStoredUser();
  if (stored && stored.id) {
    return {
      id: stored.id,
      name: stored.name || 'Citizen',
      email: stored.phone ? `${stored.phone}@crisisconnect.org` : '',
      role: stored.role || 'citizen',
      phone: stored.phone || '',
      zone_id: 'z-silchar',
      created_at: new Date().toISOString(),
    };
  }
  return {
    id: '',
    name: 'Guest Citizen',
    email: '',
    role: 'citizen',
    phone: '',
    zone_id: 'z-silchar',
    created_at: new Date().toISOString(),
  };
}

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
  lat: number | null;
  lng: number | null;
  geoStatus: GeoStatus;
  detectLocation: () => void;
  addIncident: (payload: NewIncidentPayload) => Incident;
  updateIncidentStatus: (incidentId: string, status: IncidentStatus) => void;
  getNearestShelter: (lat?: number, lng?: number) => Shelter;
  setZoneId: (zoneId: string) => void;
  refreshIncidents: () => Promise<void>;
}


const CitizenContext = createContext<CitizenContextType | undefined>(undefined);

export const CitizenProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(getAuthenticatedCitizenUser);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);

  // Shared browser geolocation state
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle');

  const detectLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setGeoStatus('unavailable');
      return;
    }
    setGeoStatus('detecting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setGeoStatus('acquired');
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setGeoStatus('denied');
        } else if (error.code === error.TIMEOUT) {
          setGeoStatus('timeout');
        } else {
          setGeoStatus('unavailable');
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  const { language, setLanguage } = useLanguage();

  useEffect(() => {
    const authUser = getAuthenticatedCitizenUser();
    if (authUser.id !== user.id) {
      setUser(authUser);
    }
  }, [user.id]);



  const refreshIncidents = useCallback(async () => {
    try {
      const backendList = await getIncidents();
      if (backendList && Array.isArray(backendList)) {
        setIncidents(backendList);

        const storedUser = getStoredUser();
        const currentUserId = user?.id || storedUser?.id;

        // Only show tracker incidents for real authenticated users.
        // Exclude guest SOS panic alerts (reporter_id === 'usr-guest') and
        // sessions where the user has no real ID.
        const isAuthenticated = !!currentUserId && currentUserId !== 'usr-guest';

        const userIncidents = isAuthenticated
          ? backendList.filter(
              (i) =>
                (i.reporter_id === currentUserId || i.reported_by_user_id === currentUserId) &&
                i.reporter_id !== 'usr-guest' &&
                i.description !== GUEST_SOS_DESCRIPTION
            )
          : [];


        if (userIncidents.length > 0) {
          const sorted = [...userIncidents].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          setActiveIncident(sorted[0]);
        } else {
          setActiveIncident(null);
        }
      }
    } catch (err) {
      console.warn('[CitizenContext] Error fetching live incidents:', err);
    }
  }, [user?.id]);




  useEffect(() => {
    refreshIncidents();

    // Subscribe to WebSocket realtime status events
    const unsubCreated = realtimeClient.subscribe('incident.created', () => refreshIncidents());
    const unsubDispatchAuthorized = realtimeClient.subscribe('dispatch.authorized', () => refreshIncidents());
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
      unsubDispatchAuthorized();
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
        lat,
        lng,
        geoStatus,
        detectLocation,
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
