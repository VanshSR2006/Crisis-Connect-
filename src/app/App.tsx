import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { LanguageProvider } from '@/lib/languageContext';

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <RouterProvider router={router} />
    </LanguageProvider>
  );
};

export default App;
