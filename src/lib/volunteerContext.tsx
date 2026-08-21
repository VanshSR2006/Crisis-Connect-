import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Dispatch, Incident, DispatchStatus } from '../types';
import { mockDispatches, mockIncidents } from '../mocks';
import { getDispatches, updateDispatchStatus } from './api/dispatches';
import { getIncidents } from './api/incidents';
import { realtimeClient } from './api/websocket';

/**
 * Enriched volunteer task type – combines a Dispatch with its Incident details.
 */
export type VolunteerTask = Dispatch & {
  incident: Incident;
};

interface VolunteerContextType {
  tasks: VolunteerTask[];
  isLoading: boolean;
  error: string | null;
  navigatingTaskId: string | null;
  activeActionTaskId: string | null;
  setNavigatingTaskId: (id: string | null) => void;
  markArrived: (taskId: string) => Promise<boolean>;
  markResolved: (taskId: string) => Promise<boolean>;
  refreshTasks: () => Promise<void>;
  clearError: () => void;
}

const VolunteerContext = createContext<VolunteerContextType | undefined>(undefined);

export const VolunteerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<VolunteerTask[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [navigatingTaskId, setNavigatingTaskId] = useState<string | null>(null);
  const [activeActionTaskId, setActiveActionTaskId] = useState<string | null>(null);

  const fetchAndMergeTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const [backendDispatches, backendIncidents] = await Promise.all([
        getDispatches(),
        getIncidents(),
      ]);

      const dispatchesList = backendDispatches && backendDispatches.length > 0
        ? backendDispatches
        : mockDispatches;

      const incidentsList = backendIncidents && backendIncidents.length > 0
        ? backendIncidents
        : mockIncidents;

      const merged: VolunteerTask[] = dispatchesList.map((dispatch) => {
        const matchingInc = incidentsList.find((i) => i.id === dispatch.incident_id);
        const fallbackInc: Incident = {
          id: dispatch.incident_id,
          title: `Emergency Incident #${dispatch.incident_id.slice(0, 6)}`,
          category: 'rescue',
          severity: 'critical',
          description: dispatch.notes || 'Emergency response assigned.',
          lat: 24.82,
          lng: 92.79,
          zone_id: 'z-silchar',
          status: dispatch.status === 'completed' ? 'resolved' : dispatch.status === 'on_site' ? 'arrived' : 'dispatched',
          priority_score: 85,
          credibility_score: 1.0,
          review_state: 'verified',
          created_at: new Date().toISOString(),
        };

        return {
          ...dispatch,
          incident: matchingInc || fallbackInc,
        };
      });

      setTasks(merged);
      setError(null);
    } catch (err) {
      console.error('[VolunteerContext] Error fetching tasks:', err);
      setError('Failed to sync field tasks from backend server.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAndMergeTasks();

    // Subscribe to WebSocket realtime updates for automated task sync
    const unsubDispatchAuth = realtimeClient.subscribe('dispatch.authorized', () => fetchAndMergeTasks());
    const unsubDispatchStatus = realtimeClient.subscribe('dispatch.status_changed', () => fetchAndMergeTasks());
    const unsubIncidentUpdated = realtimeClient.subscribe('incident.updated', () => fetchAndMergeTasks());

    return () => {
      unsubDispatchAuth();
      unsubDispatchStatus();
      unsubIncidentUpdated();
    };
  }, [fetchAndMergeTasks]);

  const clearError = () => setError(null);

  const markArrived = async (taskId: string): Promise<boolean> => {
    if (activeActionTaskId) return false;
    setActiveActionTaskId(taskId);
    setError(null);

    try {
      const updated = await updateDispatchStatus(taskId, 'on_site');
      if (updated) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: 'on_site',
                  incident: { ...t.incident, status: 'arrived' },
                }
              : t
          )
        );
        return true;
      } else {
        setError(`Failed to update task ${taskId} to Arrived. Backend rejected update or is unreachable.`);
        return false;
      }
    } catch (err) {
      console.error(`[VolunteerContext] Error marking arrived for ${taskId}:`, err);
      setError(`Network error while updating task ${taskId} to Arrived.`);
      return false;
    } finally {
      setActiveActionTaskId(null);
    }
  };

  const markResolved = async (taskId: string): Promise<boolean> => {
    if (activeActionTaskId) return false;
    setActiveActionTaskId(taskId);
    setError(null);

    try {
      const updated = await updateDispatchStatus(taskId, 'completed');
      if (updated) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: 'completed',
                  incident: { ...t.incident, status: 'resolved' },
                }
              : t
          )
        );
        return true;
      } else {
        setError(`Failed to resolve task ${taskId}. Backend rejected update or is unreachable.`);
        return false;
      }
    } catch (err) {
      console.error(`[VolunteerContext] Error marking resolved for ${taskId}:`, err);
      setError(`Network error while marking task ${taskId} as Resolved.`);
      return false;
    } finally {
      setActiveActionTaskId(null);
    }
  };

  return (
    <VolunteerContext.Provider
      value={{
        tasks,
        isLoading,
        error,
        navigatingTaskId,
        activeActionTaskId,
        setNavigatingTaskId,
        markArrived,
        markResolved,
        refreshTasks: fetchAndMergeTasks,
        clearError,
      }}
    >
      {children}
    </VolunteerContext.Provider>
  );
};

export const useVolunteerContext = (): VolunteerContextType => {
  const ctx = useContext(VolunteerContext);
  if (!ctx) {
    throw new Error('useVolunteerContext must be used within VolunteerProvider');
  }
  return ctx;
};
