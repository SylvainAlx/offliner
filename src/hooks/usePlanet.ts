import { useMemo } from "react";
import { useUser } from "../stores/userStore";
import { generatePlanetSprite } from "../utils/planetSprite";
import {
  BUILDINGS,
  BUILDING_TYPES,
  getConstructionMs,
  type BuildingDefinition,
  type BuildingType,
} from "../models/buildings";
import { missingResources, type ResourceAmounts } from "../models/resources";
import type { ConstructionBlocker } from "../models/user";

export interface BuildingTileData {
  type: BuildingType;
  definition: BuildingDefinition;
  level: number;
  nextLevel: number;
  cost: ResourceAmounts;
  missing: ResourceAmounts;
  constructionMs: number;
  blocker: ConstructionBlocker;
  isUnderConstruction: boolean;
}

export function usePlanet() {
  const user = useUser((state) => state.user);
  const startConstruction = useUser((state) => state.startConstruction);
  const { planet } = user;
  const planetKind = useMemo(() => generatePlanetSprite(planet.seed).kind, [planet.seed]);

  const buildings: BuildingTileData[] = BUILDING_TYPES.map((type) => {
    const nextLevel = user.getNextLevel(type);
    const cost = user.getNextCost(type);
    return {
      type,
      definition: BUILDINGS[type],
      level: planet.levels[type],
      nextLevel,
      cost,
      missing: missingResources(user.resources, cost),
      constructionMs: getConstructionMs(type, nextLevel),
      blocker: user.getConstructionBlocker(type),
      isUnderConstruction: planet.construction?.type === type,
    };
  });

  return {
    planet,
    planetKind,
    buildings,
    startConstruction,
  };
}
