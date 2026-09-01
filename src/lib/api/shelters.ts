import { apiFetch } from '@/lib/api/client';
import { Shelter } from '@/types';

/** GET /shelters — returns the persisted shelter inventory. */
export async function getShelters(): Promise<Shelter[]> {
  const data = await apiFetch<Shelter[]>('/shelters');
  if (!data) throw new Error('Unable to load shelters');
  return data;
}
