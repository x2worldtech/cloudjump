/**
 * Cloud Currency Utility Functions
 *
 * Cloud earning logic: 1 Cloud per 2500 height points
 */

const CLOUD_HEIGHT_THRESHOLD = 2500;

/**
 * Calculate total Clouds earned based on cumulative height (XP)
 * @param totalXp Total accumulated XP (which equals total height)
 * @returns Total Clouds earned
 */
export function calculateClouds(totalXp: number): number {
  return Math.floor(totalXp / CLOUD_HEIGHT_THRESHOLD);
}

/**
 * Calculate height remaining until next Cloud
 * @param totalXp Total accumulated XP (which equals total height)
 * @returns Height points remaining until next Cloud
 */
export function getHeightUntilNextCloud(totalXp: number): number {
  const remainder = totalXp % CLOUD_HEIGHT_THRESHOLD;
  return CLOUD_HEIGHT_THRESHOLD - remainder;
}

/**
 * Calculate progress percentage towards next Cloud
 * @param totalXp Total accumulated XP (which equals total height)
 * @returns Progress percentage (0-100)
 */
export function getCloudProgress(totalXp: number): number {
  const remainder = totalXp % CLOUD_HEIGHT_THRESHOLD;
  return (remainder / CLOUD_HEIGHT_THRESHOLD) * 100;
}

/**
 * Calculate Clouds earned from a specific height achievement
 * @param height Height achieved in a game session
 * @returns Clouds earned from this height
 */
export function getCloudsFromHeight(height: number): number {
  return Math.floor(height / CLOUD_HEIGHT_THRESHOLD);
}
