import { OFFLINIUM_DELIVERY_INTERVAL } from "../utils/constants";
import { formatDuration } from "../utils/format";
import type { MonthSummary } from "../utils/tracking";
import DayItem from "./DayItem";

interface MonthItemProps {
  month: MonthSummary;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function MonthItem({
  month,
  isExpanded,
  onToggle,
}: MonthItemProps) {
  const dayCountLabel = `${month.days.length} jour${month.days.length > 1 ? "s" : ""}`;
  const offliniumGain = Math.floor(
    month.totalDurationMs / OFFLINIUM_DELIVERY_INTERVAL,
  );

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-(--gray-200) bg-white shadow-xs transition-colors hover:border-(--gray-300)">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={`month-details-${month.key}`}
        className="flex w-full cursor-pointer items-center justify-between gap-3 p-3.5 sm:p-4 text-left transition-colors bg-(--gray-50)/60 hover:bg-(--gray-100)/70 focus-visible:outline-2 focus-visible:outline-(--green-dark)"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[rgba(34,197,94,0.12)] text-(--green-dark)">
            <svg
              className="size-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[0.92rem] font-semibold text-(--gray-900)">
              {month.label}
            </span>
            <span className="rounded-full bg-(--gray-200)/75 px-2 py-0.5 text-[0.72rem] font-medium text-(--gray-700)">
              {dayCountLabel}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[0.9rem] font-bold tabular-nums text-(--gray-900)">
              {formatDuration(month.totalDurationMs)}
            </span>
            <span className="inline-flex items-center gap-0.75 rounded-full border border-[rgba(170,59,255,0.25)] bg-[rgba(170,59,255,0.1)] px-1.75 py-0.5 font-(--mono) text-[0.725rem] text-(--accent)">
              +{offliniumGain} ⬡
            </span>
          </div>
          <svg
            className={`size-4 text-(--gray-600) transition-transform duration-200 shrink-0 ${
              isExpanded ? "rotate-180" : ""
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div
          id={`month-details-${month.key}`}
          className="border-t border-(--gray-100) bg-white px-3 sm:px-4 py-1"
        >
          <div className="flex flex-col">
            {month.days.map((day) => (
              <DayItem day={day} key={day.dayStart} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
