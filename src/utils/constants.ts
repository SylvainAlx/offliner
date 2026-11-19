export const OFFLINER_VERSION = 0.3;

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
// Companions welcomed by each level of the house.
export const COMPANIONS_PER_HOUSE = 4;
// Building costs, durations and productions live in models/building.ts.

// Time during which the app could not observe the device (background, closed,
// device asleep) cannot be verified. Beyond this threshold, the player is asked
// whether they stayed offline; if so, at most the cap is credited per gap.
export const UNOBSERVED_GAP_THRESHOLD_MS = 15 * 60 * 1000;
export const UNOBSERVED_OFFLINE_CREDIT_CAP_MS = 12 * 60 * 60 * 1000;
// Absences shorter than this (in credited offline time) get no report.
export const ABSENCE_REPORT_MIN_OFFLINE_MS = 5 * 60 * 1000;
// Durations offered by the "if you leave now" projection.
export const PROJECTION_DURATIONS_MS = [1, 4, 8, 12].map((hours) => hours * 60 * 60 * 1000);
// How often an open offline period records that the app saw the device offline.
export const OPEN_PERIOD_HEARTBEAT_MS = 30 * 1000;

export const MAX_NAME_LENGTH = 40;
export const MAX_BACKUP_FILE_BYTES = 5 * 1024 * 1024;
