export const OFFLINER_VERSION = 1.0;

// --- Offline clock ---------------------------------------------------------

/** One Offlinium delivery every 10 s of offline time: 360 /h at the base rate. */
export const OFFLINIUM_DELIVERY_INTERVAL = 10 * 1000;
/** Offlinium earned per hour offline, before the laboratory bonus. */
export const OFFLINIUM_PER_HOUR = (60 * 60 * 1000) / OFFLINIUM_DELIVERY_INTERVAL;
export const OFFLINE_CONFIRMATION_DELAY_MS = 5 * 1000;
// Time during which the app could not observe the device (background, closed,
// device asleep) cannot be verified. Beyond this threshold, the player is asked
// whether they stayed offline; if so, at most the cap is credited per gap.
export const UNOBSERVED_GAP_THRESHOLD_MS = 15 * 60 * 1000;
export const UNOBSERVED_OFFLINE_CREDIT_CAP_MS = 12 * 60 * 60 * 1000;
/**
 * Between midnight and NIGHT_END_HOUR (local time), at most
 * NIGHT_CREDIT_CAP_MS of offline time is credited per night: a phone left
 * offline all night would otherwise bring far more Offlinium than playing.
 */
export const NIGHT_END_HOUR = 7;
export const NIGHT_CREDIT_CAP_MS = 3 * 60 * 60 * 1000;
// How often an open offline period records that the app saw the device offline.
export const OPEN_PERIOD_HEARTBEAT_MS = 30 * 1000;

// --- Real-time clock -------------------------------------------------------

/** The real-time economy is computed in steps of this length at most. */
export const SIMULATION_STEP_MS = 60 * 1000;
/** How often the open app brings the economy up to date. */
export const REAL_TIME_TICK_MS = 1000;
/** The open app saves at least this often, and at every event. */
export const AUTOSAVE_INTERVAL_MS = 30 * 1000;
/** Offlinium paid per second of construction skipped (1 per 10 s). */
export const SPEED_UP_MS_PER_OFFLINIUM = 10 * 1000;

// --- Planet ----------------------------------------------------------------

export const PLANET_FIELDS = 163;
export const STARTING_RESOURCES = { metal: 500, food: 200, offlinium: 200 } as const;
export const STARTING_POPULATION = 10;
/** Production that never depends on buildings, energy or staff (per hour). */
export const BASE_METAL_PER_HOUR = 30;
export const BASE_FOOD_PER_HOUR = 10;
/** Each inhabitant eats this much per hour. */
export const FOOD_PER_INHABITANT_PER_HOUR = 1;
/** Growth per hour, as a share of the maximum population (at least 1). */
export const POPULATION_GROWTH_PER_HOUR = 0.05;
/** Loss per hour while the planet starves, as a share of the population. */
export const STARVATION_LOSS_PER_HOUR = 0.02;

// --- Expeditions -----------------------------------------------------------
/** Each spaceport level reaches this much further, from its own planet. */
export const SPACEPORT_RANGE_AU_PER_LEVEL = 0.5;
/** Real flight time per astronomical unit, with a minimum per flight. */
export const FLIGHT_MS_PER_AU = 2 * 60 * 60 * 1000;
export const MIN_FLIGHT_MS = 30 * 60 * 1000;
/** Offlinium burnt per astronomical unit. */
export const COLONIZATION_FUEL_PER_AU = 100;
export const CARGO_FUEL_PER_AU = 40;
/** Metal and food one cargo flight carries, per spaceport level. */
export const CARGO_CAPACITY_PER_LEVEL = 2000;
/**
 * Between star systems: a spaceport reaches the neighbors once past the
 * level that covers its own system; flights last longer and burn more.
 */
export const INTERSTELLAR_BASE_LEVEL = 6;
export const FLIGHT_MS_PER_LY = 12 * 60 * 60 * 1000;
export const COLONIZATION_FUEL_PER_LY = 500;
export const CARGO_FUEL_PER_LY = 200;
/** What a colony ship costs; part of it lands with the colonists. */
export const COLONIZATION_COST = { metal: 2000, food: 300 } as const;
export const COLONY_STARTING_RESOURCES = { metal: 500, food: 300 } as const;
export const COLONISTS_PER_SHIP = 10;

/**
 * Explorations of the unknown: one ship at a time for the whole empire, from
 * any spaceport; the result is known when it comes back.
 */
export const EXPLORATION_FUEL = 100;
export const EXPLORATION_DURATION_MS = 4 * 60 * 60 * 1000;
/** Survivors explorations can bring back in one game. */
export const MAX_RESCUED_INHABITANTS = 3;

/** A new inhabitant is put in the spotlight every week of the planet's life. */
export const NOTABLE_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;
export const MAX_NAME_LENGTH = 40;
export const MAX_DESCRIPTION_LENGTH = 200;
export const MAX_BACKUP_FILE_BYTES = 5 * 1024 * 1024;

// --- Score ---------------------------------------------------------------------

/** Resources spent for one point, as in OGame. */
export const RESOURCES_PER_POINT = 1000;
/** Offlinium is only earned offline: each unit spent counts twice. */
export const OFFLINIUM_SCORE_WEIGHT = 2;

// --- Keeping the save safe ---------------------------------------------------

/** A backup is suggested once the last one (or the game's start) is this old. */
export const BACKUP_REMINDER_MS = 7 * 24 * 60 * 60 * 1000;
/** "Plus tard" hides the backup reminder for this long. */
export const BACKUP_SNOOZE_MS = 3 * 24 * 60 * 60 * 1000;
/** A refused request for persistent storage is not repeated before this delay. */
export const STORAGE_PROTECTION_RETRY_MS = 7 * 24 * 60 * 60 * 1000;
