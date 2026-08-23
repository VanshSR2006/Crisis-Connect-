// TEAM OWNERSHIP: MEMBER 2 — OFFICER DASHBOARD + GIS
// Root application component and global provider tree.
// Coordinate before modifying outside this workstream.

import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './router';
import { LanguageProvider } from '@/lib/languageContext';
import { VolunteerProvider } from '@/lib/volunteerContext';
import '@/i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <VolunteerProvider>
          <RouterProvider router={router} />
        </VolunteerProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;
