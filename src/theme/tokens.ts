/**
 * Design Tokens for Disaster Response Intelligence Platform (CrisisConnect)
 * Sources of truth: Stitch MCP design system & PRD specifications.
 */

export const COLOR_TOKENS = {
  brand: {
    navy: '#0F172A',
    slate: '#475569',
    blue: '#2563EB',
    red: '#DC2626',
  },
  surfaces: {
    citizenCanvas: '#F8FAFC',
    citizenCard: '#FFFFFF',
    citizenBorder: '#E2E8F0',
    officerCanvas: '#090D16',
    officerCard: '#111827',
    officerSidebar: '#0F172A',
    officerBorder: '#1E293B',
  },
  // Severity level design scale (low=green, medium=yellow, high=orange, critical=red)
  severity: {
    low: {
      label: 'Low',
      bg: 'bg-emerald-100 dark:bg-emerald-950',
      text: 'text-emerald-800 dark:text-emerald-300',
      border: 'border-emerald-300 dark:border-emerald-800',
      badgeBg: '#dcfce7',
      badgeText: '#15803d',
    },
    medium: {
      label: 'Medium',
      bg: 'bg-amber-100 dark:bg-amber-950',
      text: 'text-amber-800 dark:text-amber-300',
      border: 'border-amber-300 dark:border-amber-800',
      badgeBg: '#fef9c3',
      badgeText: '#a16207',
    },
    high: {
      label: 'High',
      bg: 'bg-orange-100 dark:bg-orange-950',
      text: 'text-orange-800 dark:text-orange-300',
      border: 'border-orange-300 dark:border-orange-800',
      badgeBg: '#ffedd5',
      badgeText: '#c2410c',
    },
    critical: {
      label: 'Critical',
      bg: 'bg-red-100 dark:bg-red-950',
      text: 'text-red-800 dark:text-red-300',
      border: 'border-red-300 dark:border-red-800',
      badgeBg: '#fee2e2',
      badgeText: '#b91c1c',
    },
  },
} as const;

export const SPACING_TOKENS = {
  base: '4px',
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  gutter: '12px',
  marginMobile: '12px',
  marginDesktop: '24px',
} as const;

export const TYPOGRAPHY_TOKENS = {
  fontFamily: 'Inter, sans-serif',
  headlineLg: { fontSize: '24px', fontWeight: '700', lineHeight: '32px' },
  headlineMd: { fontSize: '18px', fontWeight: '600', lineHeight: '24px' },
  headlineSm: { fontSize: '16px', fontWeight: '600', lineHeight: '20px' },
  bodyMd: { fontSize: '14px', fontWeight: '400', lineHeight: '20px' },
  bodySm: { fontSize: '13px', fontWeight: '400', lineHeight: '18px' },
  labelMd: { fontSize: '12px', fontWeight: '600', lineHeight: '16px' },
  labelSm: { fontSize: '11px', fontWeight: '500', lineHeight: '14px' },
} as const;

// TODO: confirm against Stitch exact hex tokens if updated in Stitch project canvas
