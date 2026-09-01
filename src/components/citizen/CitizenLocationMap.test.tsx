import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Incident } from '@/types';

const setView = vi.fn();

vi.mock('leaflet', () => ({
  default: {
    Icon: {
      Default: {
        prototype: {},
        mergeOptions: vi.fn(),
      },
    },
  },
}));

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="map">{children}</div>,
  Marker: ({ children, position }: { children: React.ReactNode; position: [number, number] }) => (
    <div data-testid="marker" data-position={position.join(',')}>{children}</div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TileLayer: () => <div data-testid="osm-tiles" />,
  useMap: () => ({ setView }),
}));

import { CitizenLocationMap } from './CitizenLocationMap';

const incident = (overrides: Partial<Incident> = {}): Incident => ({
  id: 'incident-1',
  title: 'Flood rescue request',
  description: 'Need evacuation',
  category: 'flood',
  severity: 'high',
  status: 'reported',
  lat: 24.8333,
  lng: 92.7789,
  zone_id: 'z-silchar',
  created_at: '2026-09-01T00:00:00Z',
  ...overrides,
});

describe('CitizenLocationMap', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    setView.mockClear();
  });

  it('updates the Leaflet view and marker when the context incident changes', () => {
    const { rerender } = render(
      <CitizenLocationMap incident={incident()} userLocation={null} />
    );

    expect(screen.getByTestId('marker').getAttribute('data-position')).toBe('24.8333,92.7789');
    expect(setView).toHaveBeenLastCalledWith([24.8333, 92.7789], 15);

    rerender(
      <CitizenLocationMap
        incident={incident({ id: 'incident-2', lat: 24.9, lng: 92.85, status: 'resolved' })}
        userLocation={null}
      />
    );

    expect(screen.getByTestId('marker').getAttribute('data-position')).toBe('24.9,92.85');
    expect(setView).toHaveBeenLastCalledWith([24.9, 92.85], 15);
  });

  it('shows the unavailable state when the active incident coordinates are invalid', () => {
    render(
      <CitizenLocationMap
        incident={incident({ lat: Number.NaN, lng: 92.7789 })}
        userLocation={[24.8333, 92.7789]}
      />
    );

    expect(screen.getByText('Location unavailable for this incident.')).toBeTruthy();
    expect(screen.queryByTestId('map')).toBeNull();
  });
});
