import React, { createContext, useContext, useState } from 'react';
import { Incident, Dispatch, Resource, RiskScore, IncidentStatus, DispatchStatus } from '@/types';
import { mockIncidents, mockDispatches, mockResources, mockRiskScores } from '@/mocks';

interface CreateDispatchPayload {
  incidentId: string;
  assignedUserId: string;
  notes: string;
}

interface OfficerContextType {
  incidents: Incident[];
  dispatches: Dispatch[];
  resources: Resource[];
  riskScores: RiskScore[];
  selectedIncidentId: string | null;
  setSelectedIncidentId: (id: string | null) => void;
  updateIncidentStatus: (id: string, status: IncidentStatus) => void;
  createDispatch: (payload: CreateDispatchPayload) => Dispatch;
}

const OfficerContext = createContext<OfficerContextType | undefined>(undefined);

export const OfficerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [incidents, setIncidents] = useState<Incident[]>(mockIncidents);
  const [dispatches, setDispatches] = useState<Dispatch[]>(mockDispatches);
  const [resources] = useState<Resource[]>(mockResources);
  const [riskScores] = useState<RiskScore[]>(mockRiskScores);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(mockIncidents[0]?.id || null);

  const updateIncidentStatus = (id: string, status: IncidentStatus) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, status } : inc))
    );
  };

  const createDispatch = (payload: CreateDispatchPayload): Dispatch => {
    const newDispatch: Dispatch = {
      id: `dsp-${Date.now().toString().slice(-4)}`,
      incident_id: payload.incidentId,
      assigned_user_id: payload.assignedUserId,
      status: 'en_route' as DispatchStatus,
      dispatched_at: new Date().toISOString(),
      notes: payload.notes,
    };

    setDispatches((prev) => [newDispatch, ...prev]);

    // Automatically update incident status to 'dispatched'
    updateIncidentStatus(payload.incidentId, 'dispatched');

    return newDispatch;
  };

  return (
    <OfficerContext.Provider
      value={{
        incidents,
        dispatches,
        resources,
        riskScores,
        selectedIncidentId,
        setSelectedIncidentId,
        updateIncidentStatus,
        createDispatch,
      }}
    >
      {children}
    </OfficerContext.Provider>
  );
};

export const useOfficerContext = (): OfficerContextType => {
  const context = useContext(OfficerContext);
  if (!context) {
    throw new Error('useOfficerContext must be used within an OfficerProvider');
  }
  return context;
};
