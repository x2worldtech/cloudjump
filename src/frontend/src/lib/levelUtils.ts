// XP thresholds for levels 1-100
// Matches the backend implementation exactly
export const XP_THRESHOLDS: number[] = [
  0, 2000, 4500, 7500, 11000, 15000, 19500, 24500, 30000, 36000, 42500, 49500, 57000, 65000, 73500, 82500, 92000, 102000, 112500, 123500, 135000, 147000, 159500, 172500, 186000, 200000, 214500, 229500, 245000, 261000, 277500, 294500, 312000, 330000, 348500, 367500, 387000, 407000, 427500, 448500, 470000, 492000, 514500, 537500, 561000, 585000, 609500, 634500, 660000, 686000, 712500, 739500, 767000, 795000, 823500, 852500, 882000, 912000, 942500, 973500, 1005000, 1037000, 1069500, 1102500, 1136000, 1170000, 1204500, 1239500, 1275000, 1311000, 1347500, 1384500, 1422000, 1460000, 1498500, 1537500, 1577000, 1617000, 1657500, 1698500, 1740000, 1782000, 1824500, 1867500, 1911000, 1955000, 2000000, 2200000, 2400000, 2600000, 2800000, 3000000, 3200000, 3400000, 3600000, 3800000, 4000000,
];

// Prestige XP thresholds - only active at level 100
export const PRESTIGE_THRESHOLDS: number[] = [
  2000000,      // Prestige 1 → 2
  5000000,      // Prestige 2 → 3
  10000000,     // Prestige 3 → 4
  25000000,     // Prestige 4 → 5
  50000000,     // Prestige 5 → 6
  100000000,    // Prestige 6 → 7
  250000000,    // Prestige 7 → 8
  500000000,    // Prestige 8 → 9
  1000000000,   // Prestige 9 → 10
];

/**
 * Calculate the current level based on total XP
 * @param xp Total accumulated XP
 * @returns Current level (1-100)
 */
export function calculateLevel(xp: number): number {
  let level = 1;
  for (let i = 1; i < XP_THRESHOLDS.length; i++) {
    if (xp >= XP_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return Math.min(level, 100);
}

/**
 * Calculate the current prestige level based on total XP and level
 * Prestige system only activates at level 100
 * @param xp Total accumulated XP
 * @param level Current level (1-100)
 * @returns Current prestige level (0 if below level 100, 1-10 if at level 100)
 */
export function calculatePrestige(xp: number, level: number): number {
  if (level < 100) return 0; // Prestige system only activates at level 100

  let prestigeLevel = 1;
  for (let i = 0; i < PRESTIGE_THRESHOLDS.length; i++) {
    if (xp >= PRESTIGE_THRESHOLDS[i]) {
      prestigeLevel = i + 2; // i=0 means prestige 2, i=1 means prestige 3, etc.
    } else {
      break;
    }
  }

  return Math.min(prestigeLevel, 10); // Max out at Prestige 10
}

/**
 * Get the XP required to reach the next prestige level
 * @param currentPrestige Current prestige level (1-10)
 * @returns XP required for next prestige level, or 0 if at max prestige
 */
export function getXpForNextPrestige(currentPrestige: number): number {
  if (currentPrestige >= 10) return 0; // Max prestige reached
  if (currentPrestige < 1) return PRESTIGE_THRESHOLDS[0]; // First prestige threshold
  
  const thresholdIndex = currentPrestige - 1; // Prestige 1 → index 0, Prestige 2 → index 1, etc.
  if (thresholdIndex >= PRESTIGE_THRESHOLDS.length) return 0;
  
  return PRESTIGE_THRESHOLDS[thresholdIndex];
}

/**
 * Get the XP threshold for the current prestige level
 * @param currentPrestige Current prestige level (1-10)
 * @returns XP threshold for current prestige level
 */
export function getXpForCurrentPrestige(currentPrestige: number): number {
  if (currentPrestige <= 1) return 0;
  
  const thresholdIndex = currentPrestige - 2; // Prestige 2 → index 0, Prestige 3 → index 1, etc.
  if (thresholdIndex < 0 || thresholdIndex >= PRESTIGE_THRESHOLDS.length) return 0;
  
  return PRESTIGE_THRESHOLDS[thresholdIndex];
}

/**
 * Calculate XP progress within the current prestige level
 * @param totalXp Total accumulated XP
 * @param currentPrestige Current prestige level (1-10)
 * @returns XP earned within the current prestige level
 */
export function getCurrentPrestigeXp(totalXp: number, currentPrestige: number): number {
  const currentPrestigeThreshold = getXpForCurrentPrestige(currentPrestige);
  return totalXp - currentPrestigeThreshold;
}

/**
 * Calculate XP needed to reach the next prestige level from current XP
 * @param totalXp Total accumulated XP
 * @param currentPrestige Current prestige level (1-10)
 * @returns XP needed for next prestige level
 */
export function getXpNeededForNextPrestige(totalXp: number, currentPrestige: number): number {
  if (currentPrestige >= 10) return 0;
  const nextPrestigeThreshold = getXpForNextPrestige(currentPrestige);
  const currentPrestigeThreshold = getXpForCurrentPrestige(currentPrestige);
  return nextPrestigeThreshold - currentPrestigeThreshold;
}

/**
 * Calculate progress percentage towards next prestige level
 * @param totalXp Total accumulated XP
 * @param currentPrestige Current prestige level (1-10)
 * @returns Progress percentage (0-100)
 */
export function getPrestigeProgress(totalXp: number, currentPrestige: number): number {
  if (currentPrestige >= 10) return 100;
  
  const currentPrestigeXp = getCurrentPrestigeXp(totalXp, currentPrestige);
  const xpNeeded = getXpNeededForNextPrestige(totalXp, currentPrestige);
  
  if (xpNeeded === 0) return 100;
  return Math.min((currentPrestigeXp / xpNeeded) * 100, 100);
}

/**
 * Get the XP required to reach the next level
 * @param currentLevel Current level (1-100)
 * @returns XP required for next level, or 0 if at max level
 */
export function getXpForNextLevel(currentLevel: number): number {
  if (currentLevel >= 100) return 0;
  return XP_THRESHOLDS[currentLevel];
}

/**
 * Get the XP threshold for the current level
 * @param currentLevel Current level (1-100)
 * @returns XP threshold for current level
 */
export function getXpForCurrentLevel(currentLevel: number): number {
  if (currentLevel <= 1) return 0;
  return XP_THRESHOLDS[currentLevel - 1];
}

/**
 * Calculate XP progress within the current level
 * @param totalXp Total accumulated XP
 * @param currentLevel Current level (1-100)
 * @returns XP earned within the current level
 */
export function getCurrentLevelXp(totalXp: number, currentLevel: number): number {
  const currentLevelThreshold = getXpForCurrentLevel(currentLevel);
  return totalXp - currentLevelThreshold;
}

/**
 * Calculate XP needed to reach the next level from current XP
 * @param totalXp Total accumulated XP
 * @param currentLevel Current level (1-100)
 * @returns XP needed for next level
 */
export function getXpNeededForNextLevel(totalXp: number, currentLevel: number): number {
  if (currentLevel >= 100) return 0;
  const nextLevelThreshold = getXpForNextLevel(currentLevel);
  const currentLevelThreshold = getXpForCurrentLevel(currentLevel);
  return nextLevelThreshold - currentLevelThreshold;
}

/**
 * Calculate progress percentage towards next level
 * @param totalXp Total accumulated XP
 * @param currentLevel Current level (1-100)
 * @returns Progress percentage (0-100)
 */
export function getLevelProgress(totalXp: number, currentLevel: number): number {
  if (currentLevel >= 100) return 100;
  
  const currentLevelXp = getCurrentLevelXp(totalXp, currentLevel);
  const xpNeeded = getXpNeededForNextLevel(totalXp, currentLevel);
  
  if (xpNeeded === 0) return 100;
  return Math.min((currentLevelXp / xpNeeded) * 100, 100);
}
