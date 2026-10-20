import { useMemo, useState } from "react";
import PeriodItem from "./PeriodItem";
import MonthItem from "./MonthItem";
import Card from "./ui/Card";
import { useTracking } from "../hooks/useTracking";
import { groupDaysByMonth } from "../utils/tracking";

export default function Tracking() {
  const { completedDays, openPeriod, now } = useTracking();
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

  const monthGroups = useMemo(() => {
    return groupDaysByMonth(completedDays);
  }, [completedDays]);

  const allExpanded =
    monthGroups.length > 0 &&
    monthGroups.every((group) => expandedMonths[group.key]);

  const toggleMonth = (key: string) => {
    setExpandedMonths((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedMonths({});
    } else {
      const next: Record<string, boolean> = {};
      for (const group of monthGroups) {
        next[group.key] = true;
      }
      setExpandedMonths(next);
    }
  };

  return (
    <Card
      ariaLabel="Historique des périodes hors ligne"
      title="Historique"
      subtitle="Suivez vos périodes hors ligne et leur impact sur votre village."
    >
      <div className="mb-1 flex w-full items-center justify-between gap-3 border-b border-(--gray-100) pb-3">
        <p className="text-[0.82rem] font-medium text-(--gray-600)">
          {completedDays.length} journée{completedDays.length > 1 ? "s" : ""}{" "}
          enregistrée{completedDays.length > 1 ? "s" : ""}
          {monthGroups.length > 0 && ` · ${monthGroups.length} mois`}
        </p>
        {monthGroups.length > 1 && (
          <button
            type="button"
            onClick={toggleAll}
            className="cursor-pointer text-[0.78rem] font-medium text-(--green-dark) transition-colors hover:underline"
          >
            {allExpanded ? "Tout replier" : "Tout déplier"}
          </button>
        )}
      </div>

      {openPeriod && (
        <div className="w-full">
          <PeriodItem isOpen={true} now={now} period={openPeriod} />
        </div>
      )}

      {monthGroups.length > 0 ? (
        <div className="flex w-full flex-col gap-3">
          {monthGroups.map((month) => (
            <MonthItem
              key={month.key}
              month={month}
              isExpanded={!!expandedMonths[month.key]}
              onToggle={() => toggleMonth(month.key)}
            />
          ))}
        </div>
      ) : (
        !openPeriod && (
          <div className="w-full p-[24px_12px] text-center text-(--gray-600)">
            <p className="mb-1.5 text-[0.9rem]">
              Aucune période hors ligne enregistrée.
            </p>
            <p className="text-[0.82rem] text-(--gray-600) opacity-80">
              Déconnectez-vous pour commencer le suivi.
            </p>
          </div>
        )
      )}
    </Card>
  );
}
