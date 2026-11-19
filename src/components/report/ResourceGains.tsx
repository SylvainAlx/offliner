import {
  RESOURCE_ICONS,
  RESOURCE_LABELS,
  RESOURCE_TYPES,
  type ResourceAmounts,
} from "../../models/resources";

/** One big figure per resource: what an absence brought, or will bring. */
export default function ResourceGains({ gains }: { gains: ResourceAmounts }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {RESOURCE_TYPES.map((type) => (
        <div
          key={type}
          className="flex flex-col items-center rounded-xl border border-(--gray-100) bg-(--gray-50) px-2 py-2.5"
        >
          <span className="font-(--mono) text-[1.1rem] font-bold text-(--gray-900)">
            +{(gains[type] ?? 0).toLocaleString("fr-FR")} {RESOURCE_ICONS[type]}
          </span>
          <span className="text-[0.68rem] text-(--gray-500)">
            {RESOURCE_LABELS[type]}
          </span>
        </div>
      ))}
    </div>
  );
}
