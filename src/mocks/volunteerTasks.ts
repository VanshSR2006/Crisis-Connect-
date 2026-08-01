import { Dispatch, Incident } from '@/types';
import { mockDispatches, mockIncidents } from '@/mocks';

/**
 * Enriched volunteer task list – combines dispatches assigned to the volunteer
 * with the incident details they refer to. This mirrors the logic in
 * VolunteerContext but provides a ready‑made array for any component that
 * prefers static import (e.g., mock UI preview or tests).
 */
export const mockVolunteerTasks: (Dispatch & { incident: Incident })[] = (() => {
  const volunteerId = 'usr-003'; // Priya Patel (consistent with mock data)
  const dispatches = mockDispatches.filter((d) => d.assigned_user_id === volunteerId);
  return dispatches.map((d) => {
    const incident = mockIncidents.find((i) => i.id === d.incident_id) as Incident;
    return { ...d, incident } as Dispatch & { incident: Incident };
  });
})();
