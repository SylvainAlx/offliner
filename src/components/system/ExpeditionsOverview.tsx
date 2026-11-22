import { useUser } from "../../stores/userStore";
import type { ExpeditionReport } from "../../models/user";
import { formatResources } from "../../models/resources";
import { formatCountdown, formatDateTime } from "../../utils/format";

function describeReport(report: ExpeditionReport): string {
  switch (report.outcome) {
    case "founded":
      return `${report.targetName} colonisée par ${report.colonists} colons.`;
    case "delivered":
      return `Cargo livré sur ${report.targetName} : ${formatResources(report.cargo)}.`;
    case "returned":
      return `Impossible de se poser sur ${report.targetName} : tout est revenu au point de départ.`;
  }
}

const REPORT_ICONS: Record<ExpeditionReport["outcome"], string> = {
  founded: "🏳️",
  delivered: "📦",
  returned: "↩️",
};

/** Expeditions in flight and the latest reports. Hidden until the first one. */
export default function ExpeditionsOverview() {
  const user = useUser((state) => state.user);
  const now = user.realTimeSettledAt;
  const inFlight = [...user.expeditions].sort((a, b) => a.arriveAt - b.arriveAt);
  const reports = user.expeditionReports.slice(0, 3);
  if (inFlight.length === 0 && reports.length === 0) return null;
  const nameOf = (targetId: string) =>
    user.getColonyAt(targetId)?.planet.name ??
    user.system.planets.find((planet) => planet.id === targetId)?.name ??
    "?";

  return (
    <section className="flex w-full flex-col gap-2" aria-label="Expéditions">
      <h3 className="m-0 text-[0.95rem] font-extrabold text-(--gray-900)">Expéditions</h3>
      {inFlight.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {inFlight.map((expedition) => {
            const total = expedition.arriveAt - expedition.departAt;
            const remaining = Math.max(0, expedition.arriveAt - now);
            const progress = total > 0 ? Math.min(100, ((total - remaining) / total) * 100) : 100;
            const from = user.getColony(expedition.fromColonyId)?.planet.name ?? "?";
            return (
              <li
                key={expedition.id}
                className="rounded-xl border border-(--accent-border) bg-(--surface) px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2 text-[0.78rem]">
                  <span className="min-w-0 text-(--gray-900) [overflow-wrap:anywhere]">
                    {expedition.kind === "colonization" ? "🚀 Colonisation" : "📦 Cargo"} ·{" "}
                    {from} → <strong>{nameOf(expedition.targetId)}</strong>
                  </span>
                  <span className="shrink-0 font-(--mono) text-(--accent)">
                    {formatCountdown(remaining)}
                  </span>
                </div>
                <div
                  className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-(--gray-200)"
                  role="progressbar"
                  aria-label={`Vol vers ${nameOf(expedition.targetId)}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(progress)}
                >
                  <div className="h-full rounded-full bg-(--accent-solid)" style={{ width: `${progress}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {reports.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {reports.map((report) => (
            <li key={report.id} className="flex gap-2 text-[0.74rem] leading-snug text-(--gray-600)">
              <span aria-hidden="true">{REPORT_ICONS[report.outcome]}</span>
              <span>
                <span className="font-(--mono) text-(--gray-500)">{formatDateTime(report.arriveAt)}</span>{" "}
                {describeReport(report)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
