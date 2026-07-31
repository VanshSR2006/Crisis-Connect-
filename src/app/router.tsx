import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts
import { CitizenLayout } from '@/layouts/CitizenLayout';
import { OfficerLayout } from '@/layouts/OfficerLayout';
import { VolunteerLayout } from '@/layouts/VolunteerLayout';
import { AuthLayout } from '@/layouts/AuthLayout';

// Auth Pages
import { Login } from '@/pages/auth/Login';

// Citizen Pages
import { Home as CitizenHome } from '@/pages/citizen/Home';
import { SosReport } from '@/pages/citizen/SosReport';
import { Shelters } from '@/pages/citizen/Shelters';
import { Alerts } from '@/pages/citizen/Alerts';
import { Profile } from '@/pages/citizen/Profile';

// Officer Pages
import { Dashboard as OfficerDashboard } from '@/pages/officer/Dashboard';
import { LiveMap } from '@/pages/officer/LiveMap';
import { Incidents } from '@/pages/officer/Incidents';
import { Dispatch } from '@/pages/officer/Dispatch';
import { RiskHeatmap } from '@/pages/officer/RiskHeatmap';
import { Statistics } from '@/pages/officer/Statistics';

// Volunteer Pages
import { Tasks as VolunteerTasks } from '@/pages/volunteer/Tasks';
import { Resources as VolunteerResources } from '@/pages/volunteer/Resources';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: <Login />,
      },
    ],
  },
  {
    path: '/citizen',
    element: <CitizenLayout />,
    children: [
      {
        path: '',
        element: <Navigate to="/citizen/home" replace />,
      },
      {
        path: 'home',
        element: <CitizenHome />,
      },
      {
        path: 'sos-report',
        element: <SosReport />,
      },
      {
        path: 'shelters',
        element: <Shelters />,
      },
      {
        path: 'alerts',
        element: <Alerts />,
      },
      {
        path: 'profile',
        element: <Profile />,
      },
    ],
  },
  {
    path: '/officer',
    element: <OfficerLayout />,
    children: [
      {
        path: '',
        element: <Navigate to="/officer/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <OfficerDashboard />,
      },
      {
        path: 'live-map',
        element: <LiveMap />,
      },
      {
        path: 'incidents',
        element: <Incidents />,
      },
      {
        path: 'dispatch',
        element: <Dispatch />,
      },
      {
        path: 'risk-heatmap',
        element: <RiskHeatmap />,
      },
      {
        path: 'statistics',
        element: <Statistics />,
      },
    ],
  },
  {
    path: '/volunteer',
    element: <VolunteerLayout />,
    children: [
      {
        path: '',
        element: <Navigate to="/volunteer/tasks" replace />,
      },
      {
        path: 'tasks',
        element: <VolunteerTasks />,
      },
      {
        path: 'resources',
        element: <VolunteerResources />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);
