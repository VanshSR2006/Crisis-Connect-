import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EmergencySOSButton } from './EmergencySOSButton';
import * as incidentsApi from '@/lib/api/incidents';
import * as offlineQueue from '@/lib/offlineQueue';

describe('EmergencySOSButton', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the Emergency SOS button in idle state', () => {
    render(<EmergencySOSButton />);
    expect(screen.getByRole('button')).toBeDefined();
    expect(screen.getByText(/Emergency SOS/i)).toBeDefined();
  });

  it('submits an incident when clicked online and transitions to sent status', async () => {
    const createIncidentSpy = vi.spyOn(incidentsApi, 'createIncident').mockResolvedValue({
      id: 'inc-test-123',
      title: 'Emergency SOS Report',
      category: 'rescue',
      severity: 'critical',
      description: 'Emergency SOS — panic alert triggered from login page',
      lat: 24.82,
      lng: 92.79,
      zone_id: 'z-silchar',
      reporter_id: 'usr-guest',
      status: 'reported',
      priority_score: 85,
      credibility_score: 1.0,
      review_state: 'unverified',
      created_at: new Date().toISOString(),
    } as any);

    render(<EmergencySOSButton />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(createIncidentSpy).toHaveBeenCalledTimes(1);
    });

    expect(createIncidentSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Emergency SOS Report',
        category: 'rescue',
        severity: 'critical',
        zone_id: 'z-silchar',
        reporter_id: 'usr-guest',
      }),
      expect.objectContaining({
        idempotencyKey: expect.stringMatching(/^SOS-/),
      })
    );

    expect(await screen.findByText(/Emergency distress signal sent/i)).toBeDefined();
  });

  it('queues an SOS report offline when navigator is offline', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const enqueueSpy = vi.spyOn(offlineQueue, 'enqueueSosReport');

    render(<EmergencySOSButton />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(enqueueSpy).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByText(/Queued — will send when connected/i)).toBeDefined();
  });

  it('updates from queued to sent when background sync completes', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    let capturedClientId = '';
    vi.spyOn(offlineQueue, 'enqueueSosReport').mockImplementation((report) => {
      capturedClientId = report.client_id || report.id || '';
      return { ...report, id: capturedClientId, queued_at: new Date().toISOString() } as any;
    });

    render(<EmergencySOSButton />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(await screen.findByText(/Queued — will send when connected/i)).toBeDefined();

    act(() => {
      window.dispatchEvent(
        new CustomEvent('sos-report-synced', {
          detail: {
            clientId: capturedClientId,
            backendIncident: { id: 'inc-backend-999' },
          },
        })
      );
    });

    expect(await screen.findByText(/Emergency distress signal sent/i)).toBeDefined();
  });

  it('allows dismissing the sent banner to reset to idle', async () => {
    vi.spyOn(incidentsApi, 'createIncident').mockResolvedValue({
      id: 'inc-123',
    } as any);

    render(<EmergencySOSButton />);

    fireEvent.click(screen.getByRole('button'));
    expect(await screen.findByText(/Emergency distress signal sent/i)).toBeDefined();

    const closeBtn = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeBtn);

    expect(await screen.findByText(/Emergency SOS/i)).toBeDefined();
  });

  it('retries on weak network and succeeds on attempt 2 with identical idempotencyKey', async () => {
    const createIncidentSpy = vi
      .spyOn(incidentsApi, 'createIncident')
      .mockRejectedValueOnce(new Error('Network timeout on 3G'))
      .mockResolvedValueOnce({ id: 'inc-weak-success-2' } as any);

    render(<EmergencySOSButton />);

    fireEvent.click(screen.getByRole('button'));

    await waitFor(
      () => {
        expect(createIncidentSpy).toHaveBeenCalledTimes(2);
      },
      { timeout: 4000 }
    );

    // Verify both attempts shared the exact same idempotencyKey (preventing duplicate creation)
    const firstCallKey = createIncidentSpy.mock.calls[0][1]?.idempotencyKey;
    const secondCallKey = createIncidentSpy.mock.calls[1][1]?.idempotencyKey;
    expect(firstCallKey).toBeDefined();
    expect(firstCallKey).toEqual(secondCallKey);

    expect(await screen.findByText(/Emergency distress signal sent/i)).toBeDefined();
  });

  it('falls back to offline queue after all 3 weak network retries fail', async () => {
    const createIncidentSpy = vi
      .spyOn(incidentsApi, 'createIncident')
      .mockRejectedValue(new Error('Persistent high-loss network drop'));
    const enqueueSpy = vi.spyOn(offlineQueue, 'enqueueSosReport');

    render(<EmergencySOSButton />);

    fireEvent.click(screen.getByRole('button'));

    await waitFor(
      () => {
        expect(createIncidentSpy).toHaveBeenCalledTimes(3);
        expect(enqueueSpy).toHaveBeenCalledTimes(1);
      },
      { timeout: 8000 }
    );

    expect(await screen.findByText(/Queued — will send when connected/i)).toBeDefined();
  });
});
