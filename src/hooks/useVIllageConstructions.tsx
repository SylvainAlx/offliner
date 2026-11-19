import { useEffect } from "react";
import { useOnlineStatus } from "../stores/onlineStatusStore";
import { useUser } from "../stores/userStore";
import { COMPANION_INVOCATION_COST } from "../utils/constants";
import {
  BUILDINGS,
  BUILDING_TYPES,
  getBuildingProduction,
  type BuildingDefinition,
  type BuildingType,
} from "../models/building";
import {
  hasResources,
  missingResources,
  type ResourceAmounts,
  type Resources,
} from "../models/resources";
import type { PendingElement } from "../models/village";
import { formatCountdown } from "../utils/format";

export interface BuildingTileData {
  type: BuildingType;
  definition: BuildingDefinition;
  level: number;
  /** Level the next construction would reach. */
  nextLevel: number;
  cost: ResourceAmounts;
  missing: ResourceAmounts;
  constructionOfflineMs: number;
  /** Production per delivery at the current and at the next level. */
  production: ResourceAmounts;
  nextProduction: ResourceAmounts;
  isUnlocked: boolean;
  isMaxed: boolean;
  canQueue: boolean;
  pendingElements: PendingElement[];
}

export function useVillageConstructions() {
  const user = useUser((state) => state.user);
  const queueBuilding = useUser((state) => state.queueBuilding);
  const invokeCompanion = useUser((state) => state.invokeCompanion);

  const completePendingElements = useUser(
    (state) => state.completePendingElements,
  );
  const isOnline = useOnlineStatus((state) => state.isOnline);
  const totalOfflineMs = useOnlineStatus((state) => state.totalOfflineMs);
  const { village } = user;
  const { companions, pendingElements } = village;
  const companionCapacity = village.companionCapacity;
  const available: Resources = user.getAvailableResources(totalOfflineMs);

  useEffect(() => {
    completePendingElements(totalOfflineMs);
  }, [completePendingElements, totalOfflineMs]);

  const buildings: BuildingTileData[] = BUILDING_TYPES.map((type) => {
    const level = village.getBuildingLevel(type);
    const plannedLevel = village.getPlannedLevel(type);
    const cost = village.getNextBuildingCost(type);
    const isUnlocked = village.isBuildingUnlocked(type);
    const isMaxed = village.isBuildingMaxed(type);
    return {
      type,
      definition: BUILDINGS[type],
      level,
      nextLevel: plannedLevel + 1,
      cost,
      missing: missingResources(available, cost),
      constructionOfflineMs: village.getNextBuildingConstructionMs(type),
      production: getBuildingProduction(type, plannedLevel),
      nextProduction: getBuildingProduction(type, plannedLevel + 1),
      isUnlocked,
      isMaxed,
      canQueue: isUnlocked && !isMaxed && hasResources(available, cost),
      pendingElements: pendingElements.filter((pending) => pending.type === type),
    };
  });

  const companionCost: ResourceAmounts = { offlinium: COMPANION_INVOCATION_COST };
  const pendingCompanions = pendingElements.filter(
    (pending) => pending.type === "companion",
  );
  const hasCompanionSlot = village.canInvokeCompanion();
  const canInvoke = hasCompanionSlot && hasResources(available, companionCost);

  const renderProgress = (pending: PendingElement) => {
    const queueIndex = pendingElements.findIndex(
      (element) => element.id === pending.id,
    );
    const isActive = queueIndex === 0;
    const elapsed = isActive
      ? Math.max(0, totalOfflineMs - pending.offlineMsAtStart)
      : 0;
    const remaining = pending.constructionOfflineMs - elapsed;
    const progress = isActive
      ? Math.min(
          100,
          Math.max(0, (elapsed / pending.constructionOfflineMs) * 100),
        )
      : 0;
    const levelLabel =
      pending.targetLevel !== undefined ? ` · niv. ${pending.targetLevel}` : "";

    return (
      <span className="flex flex-col gap-1" key={pending.id}>
        <span className="flex justify-between gap-2 text-[0.68rem] text-(--gray-600)">
          <span>
            {isActive
              ? isOnline
                ? "En attente hors ligne"
                : pending.type === "companion"
                  ? "Invocation"
                  : `Construction${levelLabel}`
              : `En file · position ${queueIndex + 1}${levelLabel}`}
          </span>
          <strong className="font-[var(--mono)] text-[0.7rem] text-(--accent)">
            {isActive ? formatCountdown(remaining) : "—"}
          </strong>
        </span>
        <span
          className="block h-[5px] w-full overflow-hidden rounded-full bg-[rgba(170,59,255,0.12)]"
          aria-hidden="true"
        >
          <span
            className="block h-full rounded-[inherit] bg-(--accent) transition-[width] duration-[350ms] ease-out"
            style={{ width: `${progress}%` }}
          />
        </span>
      </span>
    );
  };

  return {
    buildings,
    companions,
    companionCapacity,
    companionCost,
    canInvoke,
    hasCompanionSlot,
    houseLevel: village.getBuildingLevel("house"),
    getLevel: (type: BuildingType) => village.getBuildingLevel(type),
    getPlannedLevel: (type: BuildingType) => village.getPlannedLevel(type),
    invokeCompanion,
    queueBuilding,
    pendingElements,
    pendingCompanions,
    renderProgress,
    totalOfflineMs,
    available,
  };
}
