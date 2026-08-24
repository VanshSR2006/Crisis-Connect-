import { describe, expect, it } from 'vitest';
import type { Dispatch } from '@/types';
import { getDispatchesForVolunteer } from '@/lib/volunteerContext';

const dispatches: Dispatch[] = [
  { id: 'assigned', incident_id: 'inc-1', assigned_user_id: 'real-volunteer-id', status: 'pending', dispatched_at: '2026-08-24T00:00:00Z' },
  { id: 'other', incident_id: 'inc-2', assigned_user_id: 'another-volunteer-id', status: 'pending', dispatched_at: '2026-08-24T00:00:00Z' },
];

describe('volunteer dispatch selection', () => {
  it('shows only dispatches assigned to the authenticated volunteer ID', () => {
    expect(getDispatchesForVolunteer(dispatches, 'real-volunteer-id')).toEqual([dispatches[0]]);
  });
});
