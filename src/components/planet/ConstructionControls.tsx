import { useUser } from "../../stores/userStore";
import { User } from "../../models/user";
import { BUILDINGS } from "../../models/buildings";
import { RESOURCE_ICONS, formatResources } from "../../models/resources";
import { formatCountdown } from "../../utils/format";

const QUARTER_HOUR_MS = 15 * 60 * 1000;

const buttonClass =
  "min-h-9 cursor-pointer rounded-[10px] border px-3 text-[0.75rem] font-bold disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-1";

/**
 * The construction in progress: its progress, and what it takes to finish
 * it sooner or to cancel it. Shared by the construction block and the
 * building's sheet.
 */
export default function ConstructionControls() {
  const user = useUser((state) => state.user);
  const cancelConstruction = useUser((state) => state.cancelConstruction);
  const speedUpConstruction = useUser((state) => state.speedUpConstruction);
  const construction = user.activeColony.planet.construction;

  if (!construction) return null;

  const now = user.realTimeSettledAt;
  const definition = BUILDINGS[construction.type];
  const total = construction.endsAt - construction.startedAt;
  const remaining = Math.max(0, construction.endsAt - now);
  const progress = total > 0 ? Math.min(100, ((total - remaining) / total) * 100) : 100;
  const offlinium = Math.floor(user.offlinium);
  const quarterCost = User.getSpeedUpCost(Math.min(QUARTER_HOUR_MS, remaining));
  const finishCost = User.getSpeedUpCost(remaining);

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-(--accent-border) bg-white/70 p-3">
      <div className="flex items-center justify-between gap-2">
        <strong className="text-[0.85rem]">
          {definition.icon} {definition.label} · niveau {construction.targetLevel}
        </strong>
        <span className="font-(--mono) text-[0.85rem] text-(--accent)">
          {formatCountdown(remaining)}
        </span>
      </div>
      <span
        className="block h-1.5 w-full overflow-hidden rounded-full bg-[rgba(170,59,255,0.12)]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        aria-label="Avancement de la construction"
      >
        <span
          className="block h-full rounded-[inherit] bg-(--accent) transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </span>
      <div className="flex flex-wrap gap-1.5">
        {remaining > QUARTER_HOUR_MS && (
          <button
            type="button"
            className={`${buttonClass} border-(--accent-border) bg-(--accent-bg) text-(--accent)`}
            disabled={offlinium < quarterCost}
            onClick={() => speedUpConstruction(QUARTER_HOUR_MS)}
          >
            −15 min · {quarterCost} {RESOURCE_ICONS.offlinium}
          </button>
        )}
        <button
          type="button"
          className={`${buttonClass} border-(--accent-solid) bg-(--accent-solid) text-(--on-color)`}
          disabled={offlinium < finishCost}
          onClick={() => speedUpConstruction(remaining)}
        >
          Terminer · {finishCost} {RESOURCE_ICONS.offlinium}
        </button>
        <button
          type="button"
          className={`${buttonClass} ml-auto border-(--gray-200) bg-white text-(--gray-700)`}
          onClick={cancelConstruction}
          title={`Rembourse ${formatResources(construction.cost)}`}
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
