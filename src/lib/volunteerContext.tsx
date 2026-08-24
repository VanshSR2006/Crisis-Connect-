import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Dispatch, Incident, DispatchStatus } from '../types';
import { mockIncidents } from '../mocks';
import { getDispatches, updateDispatchStatus } from './api/dispatches';
import { getIncidents } from './api/incidents';
import { realtimeClient } from './api/websocket';
import { useAuth } from './authContext';

/**
 * Enriched volunteer task type – combines a Dispatch with its Incident details.
 */
export type VolunteerTask = Dispatch & {
  incident: Incident;
};

export function getDispatchesForVolunteer(
  dispatches: Dispatch[],
  volunteerId: string
): Dispatch[] {
  return dispatches.filter((dispatch) => dispatch.assigned_user_id === volunteerId);
}

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
  const { session } = useAuth();
  const [tasks, setTasks] = useState<VolunteerTask[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [navigatingTaskId, setNavigatingTaskId] = useState<string | null>(null);
  const [activeActionTaskId, setActiveActionTaskId] = useState<string | null>(null);

  const fetchAndMergeTasks = useCallback(async () => {
    const currentVolunteer = session?.user;
    if (!currentVolunteer || currentVolunteer.role !== 'volunteer') {
      setTasks([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [backendDispatches, backendIncidents] = await Promise.all([
        getDispatches(),
        getIncidents(),
      ]);

      // The backend authorizes status changes by assigned_user_id. Only show
      // the dispatches owned by this authenticated volunteer in their task UI.
      const dispatchesList = getDispatchesForVolunteer(
        backendDispatches || [],
        currentVolunteer.id
      );
      const incidentsList = backendIncidents || [];

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
  }, [session?.user]);

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
        setError(`Failed to update task #${taskId.slice(0, 8)} to Arrived. API server returned an error or is offline. Please retry.`);
        return false;
      }
    } catch (err) {
      console.error(`[VolunteerContext] Error marking arrived for ${taskId}:`, err);
      setError(`Network error while updating task #${taskId.slice(0, 8)} to Arrived. Please check connection and retry.`);
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
        setError(`Failed to resolve task #${taskId.slice(0, 8)}. API server returned an error or is offline. Please retry.`);
        return false;
      }
    } catch (err) {
      console.error(`[VolunteerContext] Error marking resolved for ${taskId}:`, err);
      setError(`Network error while marking task #${taskId.slice(0, 8)} as Resolved. Please check connection and retry.`);
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
