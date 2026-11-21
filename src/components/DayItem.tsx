import type { OfflineDay } from "../models/periodList";
import { OFFLINIUM_DELIVERY_INTERVAL } from "../utils/constants";
import { formatDateTime, formatDay, formatDuration } from "../utils/format";

export default function DayItem({ day }: { day: OfflineDay }) {
  const periodLabel = `${day.periodCount} période${day.periodCount > 1 ? "s" : ""}`;

  return (
    <div className="flex w-full gap-3 border-b border-(--gray-100) py-3 last:border-b-0">
      <div className="mt-1.5 size-2.5 shrink-0 rounded-full bg-(--gray-300)" />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-[0.82rem] font-medium text-(--gray-600)">
            {formatDay(day.dayStart)}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[0.9rem] font-bold tabular-nums text-(--gray-900)">
              {formatDuration(day.durationMs)}
            </span>
            <span className="inline-flex items-center gap-0.75 rounded-full border border-[rgba(170,59,255,0.25)] bg-[rgba(170,59,255,0.1)] px-1.75 py-0.5 font-(--mono) text-[0.725rem] text-(--accent)">
              +{Math.floor(day.durationMs / OFFLINIUM_DELIVERY_INTERVAL)} ⬡
            </span>
          </div>
        </div>
        <div className="text-[0.78rem] leading-[1.4] text-(--gray-600)">
          {periodLabel} · {formatDateTime(day.firstStart)} →{" "}
          {formatDateTime(day.lastEnd)}
        </div>
      </div>
    </div>
  );
}
