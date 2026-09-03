import { apiFetch } from '@/lib/api/client';

export interface DispatchVolunteer {
  id: string;
  name: string;
  email: string | null;
}

export async function getVolunteers(): Promise<DispatchVolunteer[]> {
  return (await apiFetch<DispatchVolunteer[]>('/users?role=volunteer')) ?? [];
}
