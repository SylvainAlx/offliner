import type { PendingElement } from "../models/village";
import {
  RESOURCE_ICONS,
  RESOURCE_LABELS,
  nonZeroResources,
  type ResourceAmounts,
} from "../models/resources";
import Button from "./ui/Button";

interface CraftTileProps {
  elementName: string;
  icon: string;
  /** Short line under the name: a level, a population count… */
  status: React.ReactNode;
  cost: ResourceAmounts;
  /** Resources still missing: shown in red in the cost. */
  missing: ResourceAmounts;
  craftTime: string;
  canBuild: boolean;
  onClick: () => void;
  actionLabel: string;
  onDetail: () => void;
  pendingElements: PendingElement[];
  renderProgress: (
    pendingElement: PendingElement,
    index: number,
  ) => React.ReactNode;
}

function describeCost(cost: ResourceAmounts): string {
  const parts = nonZeroResources(cost).map(
    ([type, value]) => `${value} ${RESOURCE_LABELS[type]}`,
  );
  return parts.length > 0 ? parts.join(" et ") : "rien";
}

/** A compact tile: the details are in the modal opened by "Détail". */
export function CraftTile({
  elementName,
  icon,
  status,
  cost,
  missing,
  craftTime,
  canBuild,
  onClick,
  actionLabel,
  onDetail,
  pendingElements,
  renderProgress,
}: CraftTileProps) {
  const costParts = nonZeroResources(cost);

  return (
    <div className="flex w-full flex-col gap-2 rounded-xl border border-dashed border-(--accent-border) bg-(--gray-50) p-2.5 text-left text-(--gray-900)">
      <div className="flex items-center gap-2">
        <span
          className="grid size-9 shrink-0 place-items-center rounded-lg bg-(--accent-bg) text-[1.15rem] shadow-(--shadow-sm)"
          aria-hidden="true"
        >
          {icon}
        </span>
        <div className="min-w-0">
          <strong className="block text-[0.8rem] leading-tight [overflow-wrap:anywhere] hyphens-auto sm:text-[0.85rem]">
            {elementName}
          </strong>
          <span className="block truncate font-(--mono) text-[0.68rem] text-(--gray-600)">
            {status}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-(--mono) text-[0.7rem]">
        {costParts.length > 0 ? (
          costParts.map(([type, value]) => (
            <span
              key={type}
              className={
                missing[type] ? "text-(--red-dark)" : "text-(--accent)"
              }
              title={RESOURCE_LABELS[type]}
            >
              {value} {RESOURCE_ICONS[type]}
            </span>
          ))
        ) : (
          <span className="text-(--gray-500)">—</span>
        )}
        <span className="text-(--gray-500)">⏱️ {craftTime}</span>
      </div>

      {pendingElements.length > 0 && (
        <span className="flex flex-col gap-1 rounded-md bg-white/70 p-1.5">
          {pendingElements.map(renderProgress)}
        </span>
      )}

      <div className="mt-auto flex gap-1.5">
        <button
          type="button"
          className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-[10px] border border-(--gray-200) bg-white text-[0.85rem] font-extrabold text-(--gray-700) hover:bg-(--gray-100) focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-1"
          onClick={onDetail}
          aria-label={`Détail : ${elementName}`}
          title="Détail"
        >
          ?
        </button>
        <Button
          className="min-h-9! min-w-0 flex-1 truncate px-2! py-1.5! text-[0.78rem]!"
          disabled={!canBuild}
          onClick={onClick}
          ariaLabel={`${actionLabel} ${elementName} pour ${describeCost(cost)}`}
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}
