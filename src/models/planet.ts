import {
  BUILDING_TYPES,
  emptyLevels,
  isBuildingType,
  type BuildingLevels,
  type BuildingType,
} from "./buildings";
import { sanitizeResourceAmounts, type ResourceAmounts } from "./resources";
import { PLANET_FIELDS } from "../utils/constants";
import { PLANET_KINDS, generatePlanetSprite, type PlanetKind } from "../utils/planetSprite";
import { isFiniteNumber, isRecord, sanitizeId, sanitizeName } from "../utils/sanitize";

export interface Construction {
  type: BuildingType;
  targetLevel: number;
  startedAt: number;
  /** Real time at which the level is reached. */
  endsAt: number;
  /** What was paid, refunded in full if cancelled. */
  cost: ResourceAmounts;
}

const NAME_STARTS = ["Vel", "Kor", "Ara", "Zen", "Tal", "Ori", "Myr", "Sol", "Eri", "Nox", "Dra", "Lun"];
const NAME_ENDS = ["ora", "thus", "is", "ane", "ion", "ara", "en", "ix", "os", "ea", "um", "ys"];
const NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)];
}

/** "Velora IV", "Zenthus II"… */
export function generatePlanetName(random: () => number = Math.random): string {
  return `${pick(NAME_STARTS, random)}${pick(NAME_ENDS, random)} ${pick(NUMERALS, random)}`;
}

/** The planet's kind: the one it was given, or the one its seed draws. */
export function getPlanetKind(planet: Pick<Planet, "seed" | "kind">): PlanetKind {
  return planet.kind ?? generatePlanetSprite(planet.seed).kind;
}

export class Planet {
  /** Drives the planet's look (utils/planetSprite): never changes. */
  seed: string;
  /**
   * The kind imposed on the planet (a colony takes the one the star system
   * gave it); null when its seed decides, as for the starting planet.
   */
  kind: PlanetKind | null;
  name: string;
  fields: number;
  levels: BuildingLevels;
  construction: Construction | null;

  constructor(name: string = generatePlanetName(), seed: string = crypto.randomUUID()) {
    this.seed = seed;
    this.kind = null;
    this.name = name;
    this.fields = PLANET_FIELDS;
    this.levels = emptyLevels();
    this.construction = null;
  }

  /** Every building level takes one field, the one being built included. */
  get usedFields(): number {
    const built = BUILDING_TYPES.reduce((total, type) => total + this.levels[type], 0);
    return built + (this.construction ? 1 : 0);
  }

  get freeFields(): number {
    return Math.max(0, this.fields - this.usedFields);
  }

  get totalLevels(): number {
    return BUILDING_TYPES.reduce((total, type) => total + this.levels[type], 0);
  }

  clone(): Planet {
    const copy = new Planet(this.name, this.seed);
    copy.kind = this.kind;
    copy.fields = this.fields;
    copy.levels = { ...this.levels };
    copy.construction = this.construction
      ? { ...this.construction, cost: { ...this.construction.cost } }
      : null;
    return copy;
  }

  load(value: unknown): void {
    if (!isRecord(value)) return;
    this.name = sanitizeName(value.name) ?? this.name;
    // Saves from before the planet had a look use its name, which is stable.
    this.seed = sanitizeId(value.seed) ?? this.name;
    this.kind = PLANET_KINDS.find((kind) => kind === value.kind) ?? null;
    if (isFiniteNumber(value.fields) && value.fields > 0) {
      this.fields = Math.floor(value.fields);
    }
    if (isRecord(value.levels)) {
      for (const type of BUILDING_TYPES) {
        const level = value.levels[type];
        if (isFiniteNumber(level) && level >= 0) this.levels[type] = Math.floor(level);
      }
    }
    this.construction = loadConstruction(value.construction);
  }
}

function loadConstruction(value: unknown): Construction | null {
  if (!isRecord(value) || !isBuildingType(value.type)) return null;
  if (
    !isFiniteNumber(value.targetLevel) ||
    value.targetLevel < 1 ||
    !isFiniteNumber(value.startedAt) ||
    !isFiniteNumber(value.endsAt)
  ) {
    return null;
  }
  return {
    type: value.type,
    targetLevel: Math.floor(value.targetLevel),
    startedAt: value.startedAt,
    endsAt: value.endsAt,
    cost: sanitizeResourceAmounts(value.cost),
  };
}
