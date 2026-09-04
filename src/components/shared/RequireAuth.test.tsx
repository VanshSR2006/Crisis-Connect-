import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { AuthProvider } from '@/lib/authContext';
import { clearAuth, storeAuth } from '@/lib/auth';
import { RequireAuth } from './RequireAuth';

function renderRouterWithRole(initialEntry: string, allowedRole: 'citizen' | 'officer' | 'volunteer') {
  const router = createMemoryRouter([
    {
      element: <RequireAuth allowedRole={allowedRole} />,
      children: [
        { path: '/officer/incidents', element: <div>Officer Incidents Protected</div> },
        { path: '/officer/live-map', element: <div>Officer Live Map Protected</div> },
        { path: '/volunteer/tasks', element: <div>Volunteer Tasks Protected</div> },
        { path: '/citizen/home', element: <div>Citizen Home Protected</div> },
      ],
    },
    { path: '/login', element: <div>Login page</div> },
  ], { initialEntries: [initialEntry] });

  return render(<AuthProvider><RouterProvider router={router} /></AuthProvider>);
}

describe('RequireAuth', () => {
  afterEach(() => {
    cleanup();
    clearAuth();
  });

  it('restores a valid stored session before rendering a protected route', async () => {
    storeAuth({ token: 'jwt', user: { id: 'citizen-1', name: 'Citizen', role: 'citizen' } });

    renderRouterWithRole('/citizen/home', 'citizen');

    expect(await screen.findByText('Citizen Home Protected')).not.toBeNull();
  });

  it('redirects an unauthenticated visitor navigating directly to /officer/incidents to login', async () => {
    renderRouterWithRole('/officer/incidents', 'officer');

    expect(await screen.findByText('Login page')).not.toBeNull();
    expect(screen.queryByText('Officer Incidents Protected')).toBeNull();
  });

  it('denies and redirects a logged-in citizen attempting to access /officer/incidents', async () => {
    storeAuth({ token: 'jwt', user: { id: 'citizen-1', name: 'Citizen User', role: 'citizen' } });

    renderRouterWithRole('/officer/incidents', 'officer');

    expect(await screen.findByText('Login page')).not.toBeNull();
    expect(screen.queryByText('Officer Incidents Protected')).toBeNull();
  });

  it('denies and redirects a logged-in volunteer attempting to access /officer/live-map', async () => {
    storeAuth({ token: 'jwt', user: { id: 'volunteer-1', name: 'Volunteer User', role: 'volunteer' } });

    renderRouterWithRole('/officer/live-map', 'officer');

    expect(await screen.findByText('Login page')).not.toBeNull();
    expect(screen.queryByText('Officer Live Map Protected')).toBeNull();
  });

  it('allows an authenticated officer to access officer protected routes', async () => {
    storeAuth({ token: 'jwt', user: { id: 'officer-1', name: 'Officer User', role: 'officer' } });

    renderRouterWithRole('/officer/incidents', 'officer');

    expect(await screen.findByText('Officer Incidents Protected')).not.toBeNull();
  });

  it('allows an authenticated volunteer to access volunteer protected routes', async () => {
    storeAuth({ token: 'jwt', user: { id: 'volunteer-1', name: 'Volunteer User', role: 'volunteer' } });

    renderRouterWithRole('/volunteer/tasks', 'volunteer');

    expect(await screen.findByText('Volunteer Tasks Protected')).not.toBeNull();
  });
});
