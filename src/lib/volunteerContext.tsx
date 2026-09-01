import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Dispatch, Incident, DispatchStatus } from '../types';
import { getDispatches, updateDispatchStatus } from './api/dispatches';
import { getIncidents } from './api/incidents';
import { realtimeClient } from './api/websocket';
import { useAuth } from './authContext';

/**
 * Enriched volunteer task type – combines a Dispatch with its Incident details.
 */
export type VolunteerTask = Dispatch & {
  incident: Incident | null;
};

export function getDispatchesForVolunteer(
  dispatches: Dispatch[],
  volunteerId: string
): Dispatch[] {
  return dispatches.filter((dispatch) => dispatch.assigned_user_id === volunteerId);
}

export function mergeDispatchesWithIncidents(
  dispatches: Dispatch[],
  incidents: Incident[]
): VolunteerTask[] {
  return dispatches.map((dispatch) => ({
    ...dispatch,
    // Keep the task visible without inventing operational incident data.
    incident: incidents.find((incident) => incident.id === dispatch.incident_id) ?? null,
  }));
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
      const merged = mergeDispatchesWithIncidents(dispatchesList, backendIncidents || []);

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
                  incident: t.incident ? { ...t.incident, status: 'arrived' } : null,
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
                  incident: t.incident ? { ...t.incident, status: 'resolved' } : null,
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
