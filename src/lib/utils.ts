import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind classes cleanly without conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Helper to format date strings for emergency UI displays.
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  let formattedString = dateString;
  if (
    typeof dateString === 'string' &&
    dateString.includes('T') &&
    !dateString.endsWith('Z') &&
    !/[+-]\d{2}:\d{2}$/.test(dateString)
  ) {
    formattedString = `${dateString}Z`;
  }
  const date = new Date(formattedString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}
