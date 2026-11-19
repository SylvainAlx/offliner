import { usePendingElement } from "../hooks/usePendingElement";
import type { PendingElement } from "../models/village";
import { BUILDINGS } from "../models/building";
import { formatResources } from "../models/resources";

interface PendingElementProps {
  pending: PendingElement;
  index: number;
}

export default function PendingElement({
  pending,
  index,
}: PendingElementProps) {
  const { cancelPendingElement, totalOfflineMs } = usePendingElement();
  return (
    <div className="flex items-center justify-between gap-2.5 rounded-[10px] border border-(--gray-100) bg-(--gray-50) px-2.5 py-2 text-[0.7rem] text-(--gray-600)">
      <span>
        {pending.type === "companion"
          ? "Compagnon"
          : `${BUILDINGS[pending.type].label} niv. ${pending.targetLevel ?? 1}`}{" "}
        ·{" "}
        {index === 0 ? "en cours" : `en file ${index + 1}`}
      </span>
      <button
        type="button"
        className="flex-[0_0_auto] cursor-pointer rounded-[7px] border border-[#fecaca] bg-[#fff1f2] px-1.75 py-1.25 font-inherit text-[0.68rem] font-bold text-(--red-dark) hover:bg-[#ffe4e6] focus-visible:outline-2 focus-visible:outline-(--red-primary) focus-visible:outline-offset-1"
        onClick={() => cancelPendingElement(pending.id, totalOfflineMs)}
      >
        Annuler · rembourser {formatResources(pending.cost)}
      </button>
    </div>
  );
}
