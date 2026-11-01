export const OFFLINER_VERSION = 0.1;

export const OFFLINIUM_DELIVERY_INTERVAL = 10 * 1000;
export const OFFLINE_CONFIRMATION_DELAY_MS = 5 * 1000;
export const COMPANION_INVOCATION_COST = 60 * 6;
// Cumulative offline-life thresholds: +1 h, then +2 h, then +4 h.
export const COMPANION_STAGE_AGE_MS = {
  child: 0,
  adolescent: 60 * 60 * 1000,
  adult: 3 * 60 * 60 * 1000,
  sage: 7 * 60 * 60 * 1000,
  dead: 14 * 60 * 60 * 1000,
} as const;
export const COMPANION_STAGE_HARVEST_BONUS = {
  adolescent: 1,
  adult: 2,
  sage: 3,
  dead: 0,
} as const;
export const COMPANION_INVOCATION_OFFLINE_MS = 60 * 1000;
export const HOUSE_CONSTRUCTION_COST = 120 * 6;
export const TOWN_HALL_CONSTRUCTION_COST = 1800;
export const HOUSE_CONSTRUCTION_OFFLINE_MS = 2 * 60 * 1000;
export const TOWN_HALL_CONSTRUCTION_OFFLINE_MS = 5 * 60 * 1000;
export const COMPANIONS_PER_HOUSE = 4;
