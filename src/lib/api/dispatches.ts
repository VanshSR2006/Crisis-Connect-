import { apiFetch } from './client';
import { Dispatch, DispatchStatus } from '../../types';

/**
 * GET /dispatches – returns all dispatch assignments directly from backend database.
 */
export async function getDispatches(): Promise<Dispatch[]> {
  const data = await apiFetch<Dispatch[]>('/dispatches');
  return data || [];
}

/**
 * POST /dispatches – creates a new dispatch assignment.
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
 * PATCH /dispatches/{id} – updates dispatch status (e.g., pending -> on_site -> completed).
 * Directly issues request to backend and returns updated Dispatch model.
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



