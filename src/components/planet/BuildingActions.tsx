import { useUser } from "../../stores/userStore";
import { BUILDINGS, getConstructionMs, type BuildingType } from "../../models/buildings";
import {
  RESOURCE_ICONS,
  RESOURCE_LABELS,
  formatAmount,
  formatResources,
  missingResources,
  nonZeroResources,
} from "../../models/resources";
import { formatCountdown, formatDuration } from "../../utils/format";
import ConstructionControls from "./ConstructionControls";

/** What can be done with a building now: build its next level, or follow it. */
export default function BuildingActions({ type }: { type: BuildingType }) {
  const user = useUser((state) => state.user);
  const startConstruction = useUser((state) => state.startConstruction);
  const colony = user.activeColony;
  const construction = colony.planet.construction;

  if (construction?.type === type) return <ConstructionControls />;

  const nextLevel = colony.getNextLevel(type);
  const cost = colony.getNextCost(type);
  const missing = missingResources(user.getResources(colony), cost);
  const blocker = user.getConstructionBlocker(type, colony);
  const reason =
    blocker === "busy" && construction
      ? `Le chantier est occupé par : ${BUILDINGS[construction.type].label} (fin dans ${formatCountdown(construction.endsAt - user.realTimeSettledAt)}).`
      : blocker === "noField"
        ? "La planète n'a plus de case libre."
        : blocker === "resources"
          ? `Il vous manque ${formatResources(missing)}.`
          : null;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-(--accent-border) bg-(--accent-bg) p-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-(--mono) text-[0.8rem]">
        <strong className="font-sans text-(--gray-900)">Niveau {nextLevel}</strong>
        {nonZeroResources(cost).map(([resource, value]) => (
          <span
            key={resource}
            className={missing[resource] ? "text-(--red-dark)" : "text-(--gray-900)"}
            title={RESOURCE_LABELS[resource]}
          >
            {formatAmount(value)} {RESOURCE_ICONS[resource]}
          </span>
        ))}
        <span className="text-(--gray-600)">
          ⏱️ {formatDuration(getConstructionMs(type, nextLevel))}
        </span>
      </div>
      {reason && <p className="m-0 text-[0.76rem] text-(--gray-700)">{reason}</p>}
      <button
        type="button"
        className="min-h-10 cursor-pointer rounded-[10px] border-0 bg-(--accent-solid) px-4 text-[0.85rem] font-bold text-(--on-color) disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
        disabled={blocker !== null}
        onClick={() => startConstruction(type)}
      >
        {nextLevel === 1 ? "Construire" : `Améliorer au niveau ${nextLevel}`}
      </button>
    </div>
  );
}
