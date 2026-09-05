import { apiFetch } from './client';
import { Dispatch, DispatchStatus } from '../../types';

/**
 * GET /dispatches
 * Returns all dispatch assignments.
 */
export async function getDispatches(): Promise<Dispatch[]> {
  const data = await apiFetch<Dispatch[]>('/dispatches');
  return data || [];
}

/**
 * POST /dispatches
 * Creates a single dispatch assignment.
 */
export async function createDispatch(newDispatch: {
  incident_id: string;
  resource_id?: string;
  assigned_user_id?: string;
  eta_minutes?: number;
  notes?: string;
}): Promise<Dispatch | null> {
  const data = await apiFetch<Dispatch>('/dispatches', {
    method: 'POST',
    body: JSON.stringify(newDispatch),
  });

  return data;
}

/**
 * POST /dispatches/team
 *
 * Creates one dispatch assignment for every selected volunteer.
 */
export async function createTeamDispatch(newDispatch: {
  incident_id: string;
  volunteer_ids: string[];
  resource_id?: string;
  eta_minutes?: number;
  notes?: string;
}): Promise<Dispatch[]> {
  const data = await apiFetch<Dispatch[]>('/dispatches/team', {
    method: 'POST',
    body: JSON.stringify(newDispatch),
  });

  return data || [];
}

/**
 * PATCH /dispatches/{id}
 * Updates the status of a dispatch.
 */
export async function updateDispatchStatus(
  id: string,
  status: DispatchStatus
): Promise<Dispatch | null> {
  const data = await apiFetch<Dispatch>(`/dispatches/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

  return data;
}