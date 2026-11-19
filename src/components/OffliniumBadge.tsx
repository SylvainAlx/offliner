import { useOffliniumBadge } from "../hooks/useOffliniumBadge";
import { RESOURCE_ICONS, RESOURCE_LABELS } from "../models/resources";

export default function OffliniumBadge() {
  const { isOnline, currentOfflinium, currentMaterials } = useOffliniumBadge();

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border border-(--gray-200) bg-white px-3 py-1.5 shadow-(--shadow-sm) transition-[background-color,border-color,box-shadow] duration-300 ease-out ${
        !isOnline
          ? "border-[rgba(170,59,255,0.4)] bg-[rgba(245,235,255,0.8)] shadow-[0_0_12px_rgba(170,59,255,0.2)]"
          : ""
      }`}
    >
      <span
        className="text-[1.1rem] leading-none text-(--accent)"
        title={RESOURCE_LABELS.offlinium}
      >
        {RESOURCE_ICONS.offlinium}
      </span>
      <span className="font-(--mono) text-base text-(--gray-900)">
        {currentOfflinium}
      </span>
      {/* Always shown, even at 0, so that the player discovers materials. */}
      <span
        className="ml-1.5 text-[1rem] leading-none"
        title={RESOURCE_LABELS.materials}
      >
        {RESOURCE_ICONS.materials}
      </span>
      <span
        className="font-(--mono) text-base text-(--gray-900)"
        aria-label={`${currentMaterials} ${RESOURCE_LABELS.materials}`}
      >
        {currentMaterials}
      </span>
    </div>
  );
}
