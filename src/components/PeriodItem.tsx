import type { Period } from "../models/period";
import { OFFLINIUM_DELIVERY_INTERVAL } from "../utils/constants";
import { formatDateTime, formatDuration } from "../utils/format";

interface PeriodItemProps {
  isOpen: boolean;
  now?: number;
  period: Period;
}

export default function PeriodItem({ isOpen, now, period }: PeriodItemProps) {
  return (
    <div
      className={`flex w-full gap-3 ${
        isOpen
          ? "-mx-5 mb-3 rounded-xl border-b-0 bg-(--red-bg) px-5 py-3.5"
          : "border-b border-(--gray-100) py-3 last:border-b-0"
      }`}
    >
      <div
        className={`mt-1.5 size-2.5 shrink-0 rounded-full ${
          isOpen
            ? "bg-(--red-primary) shadow-[0_0_0_3px_rgba(239,68,68,0.25)] animate-[dotBlink_1.4s_ease-in-out_infinite]"
            : "bg-(--gray-300)"
        }`}
      />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span
            className={`text-[0.82rem] ${
              isOpen
                ? "font-bold text-(--red-dark)"
                : "font-medium text-(--gray-600)"
            }`}
          >
            {isOpen ? "En cours…" : "Terminé"}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[0.9rem] font-bold tabular-nums text-(--gray-900)">
              {formatDuration(
                period.getPeriodDurationMs(
                  isOpen && now !== undefined ? now : undefined,
                ),
              )}
            </span>
            <span
              className={`inline-flex items-center gap-0.75 rounded-full border px-1.75 py-0.5 font-(--mono) text-[0.725rem] text-(--accent) ${
                isOpen
                  ? "border-[rgba(170,59,255,0.5)] bg-white shadow-[0_0_6px_rgba(170,59,255,0.2)]"
                  : "border-[rgba(170,59,255,0.25)] bg-[rgba(170,59,255,0.1)]"
              }`}
            >
              {isOpen && now !== undefined
                ? "+" +
                  Math.floor(
                    period.getPeriodDurationMs(now) /
                      OFFLINIUM_DELIVERY_INTERVAL,
                  ) +
                  " ⬡"
                : "+" + period.getOffliniumGain() + " ⬡"}
            </span>
          </div>
        </div>
        <div className="text-[0.78rem] leading-[1.4] text-(--gray-600)">
          {isOpen
            ? "Débuté le " + formatDateTime(period.start)
            : period.end != null
              ? formatDateTime(period.start) +
                " → " +
                formatDateTime(period.end)
              : ""}
        </div>
      </div>
    </div>
  );
}
