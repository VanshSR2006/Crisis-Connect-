import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 font-sans">
      <Outlet />
    </div>
  );
};
