import React from 'react';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AuthProvider } from '@/lib/authContext';
import { storeAuth } from '@/lib/auth';
import { RequireAuth } from './RequireAuth';

function renderProtectedRoute() {
  const router = createMemoryRouter([
    {
      element: <RequireAuth allowedRole="citizen" />,
      children: [{ path: '/citizen', element: <div>Citizen home</div> }],
    },
    { path: '/login', element: <div>Login page</div> },
  ], { initialEntries: ['/citizen'] });

  return render(<AuthProvider><RouterProvider router={router} /></AuthProvider>);
}

describe('RequireAuth', () => {
  it('restores a valid stored session before rendering a protected route', async () => {
    storeAuth({ token: 'jwt', user: { id: 'citizen-1', name: 'Citizen', role: 'citizen' } });

    renderProtectedRoute();

    expect(await screen.findByText('Citizen home')).not.toBeNull();
  });

  it('redirects an unauthenticated visitor to login after restoration', async () => {
    renderProtectedRoute();

    expect(await screen.findByText('Login page')).not.toBeNull();
  });
});
