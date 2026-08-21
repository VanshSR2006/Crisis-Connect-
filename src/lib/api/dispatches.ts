import { apiFetch } from './client';
import { Dispatch, DispatchStatus } from '../../types';
import { mockDispatches } from '../../mocks';

/**
 * GET /dispatches – returns all dispatch assignments from backend.
 * Falls back to mockDispatches when backend is unreachable.
 */
export async function getDispatches(): Promise<Dispatch[]> {
  const data = await apiFetch<Dispatch[]>('/dispatches');
  return data ?? mockDispatches;
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
 * PATCH /dispatches/{id} – updates dispatch status (e.g., pending -> arrived -> resolved).
 * Returns updated dispatch object from backend, or null if failed.
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
