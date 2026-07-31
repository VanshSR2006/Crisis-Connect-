import { User } from '@/types';

export const mockUsers: User[] = [
  {
    id: 'usr-001',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@citizen.in',
    role: 'citizen',
    phone: '+91 98765 43210',
    zone_id: 'zone-north-01',
    created_at: '2026-07-28T08:30:00Z',
  },
  {
    id: 'usr-002',
    name: 'Officer Rajesh Varma',
    email: 'r.varma@disastercontrol.gov.in',
    role: 'officer',
    phone: '+91 91234 56789',
    zone_id: 'zone-hq-00',
    created_at: '2026-06-15T10:00:00Z',
  },
  {
    id: 'usr-003',
    name: 'Priya Patel',
    email: 'priya.p@reliefvolunteers.org',
    role: 'volunteer',
    phone: '+91 99887 76655',
    zone_id: 'zone-east-02',
    created_at: '2026-07-20T14:15:00Z',
  },
  {
    id: 'usr-004',
    name: 'Commander Sunita Rao',
    email: 's.rao@ndrf.gov.in',
    role: 'officer',
    phone: '+91 98111 22233',
    zone_id: 'zone-south-03',
    created_at: '2026-05-10T09:00:00Z',
  },
  {
    id: 'usr-005',
    name: 'Vikram Singh',
    email: 'vikram.singh@citizen.in',
    role: 'citizen',
    phone: '+91 97766 55443',
    zone_id: 'zone-central-04',
    created_at: '2026-07-29T11:45:00Z',
  },
];
