import { apiFetch } from '@/lib/api/client';
import { Resource } from '@/types';

/**
 * Backend ResourceResponse fields:
 *   id, name, type, quantity_available, unit, zone_id, status
 *
 * Mapped to frontend Resource type:
 *   id, name, category (from type), quantity (from quantity_available), unit, zone_id, status
 */
interface BackendResourceResponse {
  id: string;
  name: string;
  type: string;            // backend field — maps to category in frontend Resource type
  quantity_available: number; // backend field — maps to quantity in frontend Resource type
  unit: string;
  zone_id: string | null;
  status: string;
}

function adaptResource(r: BackendResourceResponse): Resource {
  return {
    id: r.id,
    name: r.name,
    category: r.type as Resource['category'],
    quantity: r.quantity_available,
    unit: r.unit,
    zone_id: r.zone_id ?? undefined,
    status: r.status as Resource['status'],
  };
}

/**
 * GET /resources
 * Returns all resource inventories mapped to the frontend Resource type.
 * Throws if the backend is unreachable (callers should handle via React Query error).
 */
export async function getResources(): Promise<Resource[]> {
  const data = await apiFetch<BackendResourceResponse[]>('/resources');
  if (!data) throw new Error('Unable to load resources');
  return data.map(adaptResource);
}

