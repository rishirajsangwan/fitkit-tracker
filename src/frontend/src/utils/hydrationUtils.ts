/**
 * Calculate recommended hydration in ml based on ride stats.
 * Formula: ((durationMinutes * 5) + (calories / 20) + (avgHeartRate ? avgHeartRate / 50 : 0)) rounded to nearest 100ml.
 */
export function calculateRecommendedHydration(
  durationMinutes: number,
  calories: number,
  avgHeartRate: number | null,
): number {
  const base = durationMinutes * 5;
  const calContrib = calories / 20;
  const hrContrib = avgHeartRate != null ? avgHeartRate / 50 : 0;
  return Math.round((base + calContrib + hrContrib) / 100) * 100;
}
