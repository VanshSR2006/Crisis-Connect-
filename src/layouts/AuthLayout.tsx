import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#fcf8fa] text-[#1b1b1d] p-4 font-sans">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
};
