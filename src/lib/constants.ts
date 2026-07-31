/**
 * Platform Constants for CrisisConnect (SIH 2026, PS3)
 */

export const APP_NAME = 'CrisisConnect';
export const APP_TAGLINE = 'Disaster Response Intelligence Platform';

export const ROLE_NAMES = {
  citizen: 'Citizen / Resident',
  officer: 'Disaster Officer',
  volunteer: 'Relief Volunteer',
} as const;

export const DEFAULT_ROLE_HOME = {
  citizen: '/citizen/home',
  officer: '/officer/dashboard',
  volunteer: '/volunteer/tasks',
} as const;
