import { useVillageProjection } from "../hooks/useVillageProjection";
import { formatResources, nonZeroResources } from "../models/resources";
import { OFFLINIUM_DELIVERY_INTERVAL } from "../utils/constants";
import { formatLength } from "../utils/format";
import ResourceGains from "./report/ResourceGains";
import VillageEventList from "./report/VillageEventList";
import VillageSection from "./VillageSection";

const SECONDS = OFFLINIUM_DELIVERY_INTERVAL / 1000;

export default function VillageProjection() {
  const {
    durations,
    durationMs,
    setDurationMs,
    originOfflineMs,
    gains,
    finalResources,
    ratesNow,
    ratesAfter,
    events,
    queueEndInMs,
    idleMs,
  } = useVillageProjection();
  const ratesChange =
    formatResources(ratesNow) !== formatResources(ratesAfter);

  return (
    <VillageSection
      title="Si vous partez maintenant"
      subtitle="Ce que votre village fera pendant votre prochain temps hors ligne."
    >
      <div
        className="mb-3 grid grid-cols-4 gap-1.5"
        role="radiogroup"
        aria-label="Durée hors ligne"
      >
        {durations.map((duration) => {
          const selected = duration === durationMs;
          return (
            <button
              key={duration}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`min-h-9 cursor-pointer rounded-[10px] border text-[0.78rem] font-bold focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-1 ${
                selected
                  ? "border-(--accent) bg-(--accent) text-white"
                  : "border-(--gray-200) bg-white text-(--gray-700) hover:bg-(--gray-100)"
              }`}
              onClick={() => setDurationMs(duration)}
            >
              {formatLength(duration)}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        <ResourceGains gains={gains} />

        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[0.76rem]">
          <dt className="text-(--gray-500)">Solde au retour</dt>
          <dd className="m-0 font-(--mono) text-(--gray-900)">
            {formatResources(finalResources)}
          </dd>
          <dt className="text-(--gray-500)">Récolte</dt>
          <dd className="m-0 font-(--mono) text-(--gray-900)">
            {nonZeroResources(ratesNow).length > 0 ? formatResources(ratesNow) : "—"}
            {ratesChange && ` → ${formatResources(ratesAfter)}`} / {SECONDS} s
          </dd>
          <dt className="text-(--gray-500)">File de construction</dt>
          <dd className="m-0 text-(--gray-900)">
            {queueEndInMs === null
              ? "Vide"
              : queueEndInMs > durationMs
                ? `Encore en cours au retour (fin dans ${formatLength(queueEndInMs)})`
                : `Terminée après ${formatLength(queueEndInMs)}`}
          </dd>
        </dl>

        {idleMs >= 60_000 && (
          <p className="m-0 rounded-lg border border-[#fde68a] bg-[#fffbeb] px-2.5 py-2 text-[0.74rem] text-[#92400e]">
            ⚠️ Votre file restera vide pendant {formatLength(idleMs)} : ajoutez
            des constructions avant de partir pour ne pas perdre ce temps.
          </p>
        )}

        {events.length > 0 && (
          <VillageEventList
            events={events}
            originOfflineMs={originOfflineMs}
            timePrefix="dans"
          />
        )}
      </div>
    </VillageSection>
  );
}
