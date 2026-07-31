import { Dispatch } from '@/types';

export const mockDispatches: Dispatch[] = [
  {
    id: 'dsp-801',
    incident_id: 'inc-101',
    assigned_user_id: 'usr-003',
    status: 'on_site',
    dispatched_at: '2026-07-30T18:35:00Z',
    notes: 'NDRF Battalion Unit 4 deployed with 2 inflatable rafts and life jackets.',
  },
  {
    id: 'dsp-802',
    incident_id: 'inc-104',
    assigned_user_id: 'usr-003',
    status: 'en_route',
    dispatched_at: '2026-07-30T20:15:00Z',
    notes: 'Ambulance Unit A-12 navigating waterlogged secondary road.',
  },
  {
    id: 'dsp-803',
    incident_id: 'inc-102',
    assigned_user_id: 'usr-004',
    status: 'pending',
    dispatched_at: '2026-07-30T19:20:00Z',
    notes: 'Awaiting structural assessment team verification before site entry.',
  },
  {
    id: 'dsp-804',
    incident_id: 'inc-105',
    assigned_user_id: 'usr-003',
    status: 'completed',
    dispatched_at: '2026-07-30T16:15:00Z',
    notes: 'Debris cleared using JCB JCB-04. Passage restored.',
  },
];
