/**
 * Helper to normalize backend risk scores for presentation.
 * Backend data layer operates on a 0.0 - 1.0 scale.
 * UI expects a 0 - 100 percentage.
 */
export function normalizeRiskScore(score: number | null | undefined): number {
  if (score === null || score === undefined) return 0;
  
  // Guard: if it's already > 1, assume it's already a percentage (0-100)
  if (score > 1.0) {
    return Math.round(score);
  }

  // Convert 0.0 - 1.0 to 0 - 100
  return Math.round(score * 100);
}
