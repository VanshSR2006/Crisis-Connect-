import { Resource } from '@/types';

export const mockResources: Resource[] = [
  {
    id: 'res-501',
    name: 'Clean Drinking Water Packets (2L)',
    category: 'water',
    quantity: 4500,
    unit: 'pouches',
    shelter_id: 'shl-01',
    status: 'available',
  },
  {
    id: 'res-502',
    name: 'Emergency Medical First-Aid Kits',
    category: 'medical',
    quantity: 120,
    unit: 'boxes',
    shelter_id: 'shl-01',
    status: 'available',
  },
  {
    id: 'res-503',
    name: 'Inflatable Motorized Rescue Boats (6-person)',
    category: 'vehicle',
    quantity: 8,
    unit: 'units',
    shelter_id: 'shl-02',
    status: 'reserved',
  },
  {
    id: 'res-504',
    name: 'Ready-to-Eat Ration Meals (MRE)',
    category: 'food',
    quantity: 0,
    unit: 'packets',
    shelter_id: 'shl-02',
    status: 'depleted',
  },
  {
    id: 'res-505',
    name: 'High-Capacity Submersible De-watering Pumps',
    category: 'equipment',
    quantity: 15,
    unit: 'pumps',
    shelter_id: 'shl-03',
    status: 'available',
  },
];
