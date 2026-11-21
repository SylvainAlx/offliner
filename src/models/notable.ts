import {
  MAX_DESCRIPTION_LENGTH,
} from "../utils/constants";
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
  name: string;
  title: string;
  description: string;
  /** When the inhabitant was put in the spotlight. */
  featuredAt: number;
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
  random: () => number = Math.random,
): Notable {
  return {
    id: crypto.randomUUID(),
    seed: crypto.randomUUID(),
    role: "leader",
    name: generateInhabitantName(random),
    title: LEADER_TITLE,
    description: `Guide la colonie ${elidedOf(planetName)} depuis le premier jour.`,
    featuredAt,
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
  return true;
}

export function loadNotables(value: unknown): Notable[] {
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
    return [{ id, seed, role: item.role, name, title, description, featuredAt: item.featuredAt }];
  });
}
