import { useMemo } from "react";
import { useUser } from "../stores/userStore";
import { getPlanetKind } from "../models/planet";
import {
  BUILDINGS,
  BUILDING_TYPES,
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
  const colony = user.activeColony;
  const { planet } = colony;
  const planetKind = useMemo(
    () => getPlanetKind({ seed: planet.seed, kind: planet.kind }),
    [planet.seed, planet.kind],
  );
  const resources = user.getResources(colony);

  const buildings: BuildingTileData[] = BUILDING_TYPES.map((type) => {
    const nextLevel = colony.getNextLevel(type);
    const cost = colony.getNextCost(type);
    return {
      type,
      definition: BUILDINGS[type],
      level: planet.levels[type],
      nextLevel,
      cost,
      missing: missingResources(resources, cost),
      constructionMs: colony.getConstructionMs(type, nextLevel),
      blocker: user.getConstructionBlocker(type, colony),
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
