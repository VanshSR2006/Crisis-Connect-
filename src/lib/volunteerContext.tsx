// TEAM OWNERSHIP: MEMBER 1 — CITIZEN PWA + VOLUNTEER WORKFLOW
// Volunteer global state: tasks, navigation, arrived/resolved actions.
// Coordinate before modifying outside this workstream.
import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { Dispatch, Incident, DispatchStatus } from '@/types';
import { mockDispatches, mockIncidents } from '@/mocks';

/**
 * Enriched volunteer task type – combines a Dispatch with its Incident details.
 */
export type VolunteerTask = Dispatch & {
  incident: Incident;
};

interface VolunteerContextType {
  tasks: VolunteerTask[];
  navigatingTaskId: string | null;
  setNavigatingTaskId: (id: string | null) => void;
  markArrived: (taskId: string) => void;
  markResolved: (taskId: string) => void;
}

const VolunteerContext = createContext<VolunteerContextType | undefined>(undefined);

/**
 * VolunteerProvider builds the task list from mockDispatches filtered to the volunteer user.
 * For this demo we assume the volunteer's user id is "usr-003" (Priya Patel) as in the mock data.
 */
export const VolunteerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const enriched = useMemo(() => {
    const volunteerId = 'usr-003';
    const dispatches = mockDispatches.filter((d) => d.assigned_user_id === volunteerId);
    return dispatches.map((d) => {
      const incident = mockIncidents.find((i) => i.id === d.incident_id) as Incident;
      return { ...d, incident } as VolunteerTask;
    });
  }, []);

  const [tasks, setTasks] = useState<VolunteerTask[]>(enriched);
  const [navigatingTaskId, setNavigatingTaskId] = useState<string | null>(null);

  const updateTaskStatus = (id: string, status: DispatchStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );
  };

  const markArrived = (taskId: string) => {
    updateTaskStatus(taskId, 'on_site');
  };

  const markResolved = (taskId: string) => {
    updateTaskStatus(taskId, 'completed');
    // Cross-role sync deferred to Phase 5.
  };

  return (
    <VolunteerContext.Provider
      value={{
        tasks,
        navigatingTaskId,
        setNavigatingTaskId,
        markArrived,
        markResolved,
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
