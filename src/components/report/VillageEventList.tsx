import type { VillageEvent } from "../../models/timeline";
import { describeVillageEvent } from "../../utils/villageEvents";
import { formatLength } from "../../utils/format";

interface VillageEventListProps {
  events: VillageEvent[];
  /** Offline time the "after…" labels are counted from. */
  originOfflineMs: number;
  /** "après" for a report, "dans" for a projection. */
  timePrefix: string;
  /** Longer lists are cut, with a count of what is left out. */
  maxItems?: number;
}

export default function VillageEventList({
  events,
  originOfflineMs,
  timePrefix,
  maxItems = 8,
}: VillageEventListProps) {
  const shown = events.slice(0, maxItems);
  const hidden = events.length - shown.length;

  return (
    <ul className="m-0 flex list-none flex-col gap-1 p-0">
      {shown.map((event, index) => {
        const { icon, text } = describeVillageEvent(event);
        return (
          <li
            key={`${event.kind}-${event.at}-${index}`}
            className="flex items-start gap-2 rounded-lg bg-(--gray-50) px-2.5 py-1.5 text-[0.76rem] text-(--gray-700)"
          >
            <span aria-hidden="true">{icon}</span>
            <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{text}</span>
            <span className="shrink-0 font-(--mono) text-[0.68rem] text-(--gray-500)">
              {timePrefix} {formatLength(event.at - originOfflineMs)}
            </span>
          </li>
        );
      })}
      {hidden > 0 && (
        <li className="px-2.5 text-[0.72rem] text-(--gray-500)">
          … et {hidden} autre{hidden > 1 ? "s" : ""} événement{hidden > 1 ? "s" : ""}
        </li>
      )}
    </ul>
  );
}
