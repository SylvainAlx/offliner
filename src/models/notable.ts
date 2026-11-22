import { MAX_DESCRIPTION_LENGTH, NOTABLE_INTERVAL_MS } from "../utils/constants";
import { createRandom, hashSeed } from "../utils/planetSprite";
import {
  isFiniteNumber,
  isRecord,
  sanitizeId,
  sanitizeName,
  sanitizeText,
} from "../utils/sanitize";

/**
 * Inhabitants put in the spotlight. The planetary leader is there from the
 * first day; other notable inhabitants will come week after week. The player
 * gives each one a name, a title and a description.
 */
export type NotableRole = "leader" | "notable";

export interface Notable {
  id: string;
  /** Drives the inhabitant's pixel-art look (utils/companionSprite). */
  seed: string;
  role: NotableRole;
  /** The colony they live on; each colony has its own leader. */
  colonyId: string;
  name: string;
  title: string;
  description: string;
  /** When the inhabitant was put in the spotlight. */
  featuredAt: number;
  /** False until the player has given them a name, a title and a story. */
  isCustomized: boolean;
}

export interface NotableChanges {
  name: string;
  title: string;
  description: string;
}

export const LEADER_TITLE = "Chef planétaire";

const FIRST_NAMES = ["Alia", "Bastien", "Céleste", "Dorian", "Elio", "Faustine", "Gaspard", "Héloïse", "Ilan", "Joran", "Kaëlle", "Lucien", "Maëva", "Nolan", "Orane", "Pélagie", "Quentin", "Rhéa", "Soren", "Talia", "Ulysse", "Vesna", "Wilfried", "Ysée", "Zéphyr"];
const LAST_NAMES = ["Arkan", "Belmont", "Castel", "Davos", "Ferral", "Galen", "Hartmann", "Ivanoff", "Kessler", "Lorne", "Marek", "Nadir", "Orsini", "Prax", "Rennard", "Solberg", "Tavern", "Valmont", "Varga", "Zorin"];

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)];
}

export function generateInhabitantName(random: () => number = Math.random): string {
  return `${pick(FIRST_NAMES, random)} ${pick(LAST_NAMES, random)}`;
}

/** "de Velora", but "d'Arays" before a vowel. */
function elidedOf(name: string): string {
  return /^[aeiouyàâäéèêëîïôöùûüh]/i.test(name) ? `d'${name}` : `de ${name}`;
}

/** The leader every planet starts with. */
export function createLeader(
  planetName: string,
  featuredAt: number,
  colonyId: string,
  random: () => number = Math.random,
): Notable {
  return {
    id: crypto.randomUUID(),
    seed: crypto.randomUUID(),
    role: "leader",
    colonyId,
    name: generateInhabitantName(random),
    title: LEADER_TITLE,
    description: `Guide la colonie ${elidedOf(planetName)} depuis le premier jour.`,
    featuredAt,
    isCustomized: false,
  };
}

/** Titles the weekly inhabitants arrive with, until the player picks one. */
const WEEKLY_TITLES = [
  "Figure de la colonie",
  "Âme du quartier",
  "Esprit inventif",
  "Mémoire de la colonie",
  "Cœur vaillant",
  "Main verte",
  "Regard vers les étoiles",
  "Voix du peuple",
  "Bâtisseur de l'ombre",
  "Gardien des réserves",
];

/** Weeks completed since the planet was founded. */
export function countWeeksSince(createdAt: number, now: number): number {
  return Math.max(0, Math.floor((now - createdAt) / NOTABLE_INTERVAL_MS));
}

/** The week (1, 2…) in which a weekly inhabitant was put in the spotlight. */
export function getNotableWeek(notable: Notable, createdAt: number): number {
  return Math.max(1, Math.round((notable.featuredAt - createdAt) / NOTABLE_INTERVAL_MS));
}

/**
 * The inhabitant of week `week`. Drawn from the planet seed, so the same
 * planet always welcomes the same inhabitants, even before it is saved.
 */
export function createWeeklyNotable(
  planetSeed: string,
  createdAt: number,
  week: number,
  colonyId: string,
): Notable {
  const seed = `${planetSeed}:week-${week}`;
  const random = createRandom(hashSeed(seed));
  return {
    id: seed,
    seed,
    role: "notable",
    colonyId,
    name: generateInhabitantName(random),
    // Titles take turns, so two weeks in a row never share one.
    title: WEEKLY_TITLES[(hashSeed(planetSeed) + week) % WEEKLY_TITLES.length],
    description: "",
    featuredAt: createdAt + week * NOTABLE_INTERVAL_MS,
    isCustomized: false,
  };
}

/** Applies the player's changes; refused when the name or title is empty. */
export function applyNotableChanges(notable: Notable, changes: NotableChanges): boolean {
  const name = sanitizeName(changes.name);
  const title = sanitizeName(changes.title);
  const description = sanitizeText(changes.description, MAX_DESCRIPTION_LENGTH);
  if (!name || !title || description === null) return false;
  notable.name = name;
  notable.title = title;
  notable.description = description;
  notable.isCustomized = true;
  return true;
}

/** `homeColonyId` adopts the inhabitants of saves from before colonies. */
export function loadNotables(value: unknown, homeColonyId: string): Notable[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isRecord(item)) return [];
    const id = sanitizeId(item.id);
    const seed = sanitizeId(item.seed);
    const name = sanitizeName(item.name);
    const title = sanitizeName(item.title);
    const description = sanitizeText(item.description, MAX_DESCRIPTION_LENGTH);
    if (!id || !seed || !name || !title || description === null) return [];
    if (item.role !== "leader" && item.role !== "notable") return [];
    if (!isFiniteNumber(item.featuredAt)) return [];
    const colonyId = sanitizeId(item.colonyId) ?? homeColonyId;
    // Saves from before this flag hold only leaders the player already saw.
    const isCustomized = item.isCustomized !== false;
    return [
      {
        id,
        seed,
        role: item.role,
        colonyId,
        name,
        title,
        description,
        featuredAt: item.featuredAt,
        isCustomized,
      },
    ];
  });
}
