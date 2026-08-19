// TEAM OWNERSHIP: MEMBER 2 — OFFICER DASHBOARD + GIS
// Root application component and global provider tree.
// Coordinate before modifying outside this workstream.
import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { LanguageProvider } from '@/lib/languageContext';
import '@/i18n';

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <RouterProvider router={router} />
    </LanguageProvider>
  );
};

export default App;
