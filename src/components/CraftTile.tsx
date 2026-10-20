import type { PendingElement } from "../models/village";
import Button from "./ui/Button";

interface CraftTileProps {
  elementName: string;
  icon: string;
  canBuild: boolean;
  onClick: () => void;
  cost: number;
  pendingElements: PendingElement[];
  renderProgress: (
    pendingElement: PendingElement,
    index: number,
  ) => React.ReactNode;
  count: React.ReactNode;
  countLabel: string;
  description: string;
  liveOfflinium: number;
  craftTime: string;
  children: React.ReactNode;
  actionLabel: string;
}

export function CraftTile({
  elementName,
  icon,
  canBuild,
  onClick,
  cost,
  pendingElements,
  renderProgress,
  count,
  countLabel,
  description,
  craftTime,
  children,
  actionLabel,
}: CraftTileProps) {
  return (
    <div className="flex w-full flex-col gap-3 rounded-2xl border border-dashed border-(--accent-border) bg-(--gray-50) p-4 text-left text-(--gray-900)">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="grid size-12 shrink-0 place-items-center rounded-xl bg-(--accent-bg) text-[1.5rem] shadow-(--shadow-sm)"
            aria-hidden="true"
          >
            {icon}
          </span>
          <div className="min-w-0">
            <strong className="block truncate text-base">{elementName}</strong>
            <span className="mt-0.5 block text-[0.74rem] leading-[1.35] text-(--gray-600)">
              {description}
            </span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <span className="block font-(--mono) text-[0.82rem] text-(--accent)">
            {cost} ⬡
          </span>
          <span className="mt-0.5 block text-[0.68rem] text-(--gray-500)">
            ⏱️ {craftTime}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-(--gray-200) pt-2.5">
        <span
          className="font-(--mono) text-[0.7rem] text-(--gray-700)"
          aria-label={countLabel}
        >
          {count} {countLabel}
        </span>
      </div>

      {pendingElements.length > 0 && (
        <span className="flex flex-col gap-1.75 rounded-lg bg-white/70 p-2">
          {pendingElements.map(renderProgress)}
        </span>
      )}

      <span
        className={`mt-auto pt-3 text-[0.75rem] font-extrabold ${
          canBuild ? "text-(--accent)" : "text-(--gray-600)"
        }`}
      >
        {children}
      </span>
      <Button
        className="w-full"
        disabled={!canBuild}
        onClick={onClick}
        aria-label={`${actionLabel} ${elementName} pour ${cost} orbes d'Offlinium`}
      >
        {actionLabel}
      </Button>
    </div>
  );
}
