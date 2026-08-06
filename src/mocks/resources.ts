import { Resource } from '@/types';

export const mockResources: Resource[] = [
  {
    id: 'res-501',
    name: 'water_packets',
    category: 'water',
    quantity: 4500,
    unit: 'pouches',
    shelter_id: 'shl-01',
    status: 'available',
  },
  {
    id: 'res-502',
    name: 'first_aid_kits',
    category: 'medical',
    quantity: 120,
    unit: 'boxes',
    shelter_id: 'shl-01',
    status: 'available',
  },
  {
    id: 'res-503',
    name: 'rescue_boats',
    category: 'vehicle',
    quantity: 8,
    unit: 'units',
    shelter_id: 'shl-02',
    status: 'reserved',
  },
  {
    id: 'res-504',
    name: 'mre_meals',
    category: 'food',
    quantity: 0,
    unit: 'packets',
    shelter_id: 'shl-02',
    status: 'depleted',
  },
  {
    id: 'res-505',
    name: 'water_pumps',
    category: 'equipment',
    quantity: 15,
    unit: 'pumps',
    shelter_id: 'shl-03',
    status: 'available',
  },
];
