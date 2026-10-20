import { useEffect } from "react";
import { useOnlineStatus } from "../stores/onlineStatusStore";
import { useUser } from "../stores/userStore";
import {
  COMPANION_INVOCATION_COST,
  HOUSE_CONSTRUCTION_COST,
  TOWN_HALL_CONSTRUCTION_COST,
} from "../utils/constants";
import type { PendingElement } from "../models/village";
import { formatCountdown } from "../utils/format";

export function useVillageConstructions() {
  const user = useUser((state) => state.user);
  const buildHouse = useUser((state) => state.buildHouse);
  const buildTownHall = useUser((state) => state.buildTownHall);
  const invokeCompanion = useUser((state) => state.invokeCompanion);

  const completePendingElements = useUser(
    (state) => state.completePendingElements,
  );
  const { isOnline, totalOfflineMs } = useOnlineStatus();
  const { houses, companions, pendingElements } = user.village;
  const companionCapacity = user.village.companionCapacity;
  const liveOfflinium = user.getAvailableOfflinium(totalOfflineMs);
  const pendingHouses = pendingElements.filter(
    (pending) => pending.type === "house",
  );
  const pendingCompanions = pendingElements.filter(
    (pending) => pending.type === "companion",
  );
  const pendingTownHalls = pendingElements.filter(
    (pending) => pending.type === "townHall",
  );

  useEffect(() => {
    completePendingElements(totalOfflineMs);
  }, [completePendingElements, totalOfflineMs]);

  const canBuildHouse = liveOfflinium >= HOUSE_CONSTRUCTION_COST;
  const canBuildTownHall =
    user.village.canBuildTownHall() &&
    liveOfflinium >= TOWN_HALL_CONSTRUCTION_COST;
  const hasCompanionSlot = user.village.canInvokeCompanion();
  const canInvoke =
    hasCompanionSlot && liveOfflinium >= COMPANION_INVOCATION_COST;

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

    return (
      <span className="flex flex-col gap-1" key={pending.id}>
        <span className="flex justify-between gap-2 text-[0.68rem] text-(--gray-600)">
          <span>
            {isActive
              ? isOnline
                ? "En attente hors ligne"
                : pending.type === "house"
                  ? "Construction"
                  : pending.type === "townHall"
                    ? "Construction de l'hôtel de ville"
                    : "Invocation"
              : `En file · position ${queueIndex + 1}`}
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
    houses,
    townHall: user.village.townHall,
    companions,
    companionCapacity,
    canBuildHouse,
    buildHouse,
    buildTownHall,
    canInvoke,
    invokeCompanion,
    pendingElements,
    pendingHouses,
    renderProgress,
    pendingCompanions,
    pendingTownHalls,
    totalOfflineMs,
    canBuildTownHall,
    liveOfflinium,
    hasCompanionSlot,
  };
}
