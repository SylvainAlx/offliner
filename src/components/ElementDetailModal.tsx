import Modal from "./ui/Modal";
import {
  BUILDINGS,
  getBuildingConstructionMs,
  getBuildingCost,
  getBuildingProduction,
  type BuildingType,
} from "../models/building";
import { COMPANION_STAGE_LABELS, COMPANION_STAGES } from "../models/companion";
import { formatResources, nonZeroResources } from "../models/resources";
import {
  COMPANIONS_PER_HOUSE,
  COMPANION_INVOCATION_COST,
  COMPANION_INVOCATION_OFFLINE_MS,
  COMPANION_STAGE_AGE_MS,
  COMPANION_STAGE_HARVEST_BONUS,
  OFFLINIUM_DELIVERY_INTERVAL,
} from "../utils/constants";
import { formatDuration } from "../utils/format";

/** How many upcoming levels the table shows. */
const LEVELS_SHOWN = 5;

export type DetailTarget = BuildingType | "companion";

interface ElementDetailModalProps {
  target: DetailTarget | null;
  /** Current and planned (current + queued) level of each building. */
  getLevel: (type: BuildingType) => number;
  getPlannedLevel: (type: BuildingType) => number;
  onClose: () => void;
}

const SECONDS = OFFLINIUM_DELIVERY_INTERVAL / 1000;

/** What a building does at a given level. */
function levelEffect(type: BuildingType, level: number): string {
  if (level <= 0) return "—";
  if (type === "house") return `${level * COMPANIONS_PER_HOUSE} places`;
  if (type === "townHall") return "Noms et production débloqués";
  const production = getBuildingProduction(type, level);
  return nonZeroResources(production).length > 0
    ? `+${formatResources(production)} / ${SECONDS} s`
    : "—";
}

function describeRequirements(type: BuildingType): string | null {
  const requires = Object.entries(BUILDINGS[type].requires ?? {}) as Array<
    [BuildingType, number]
  >;
  if (requires.length === 0) return null;
  return requires
    .map(([required, level]) =>
      level > 1 ? `${BUILDINGS[required].label} niv. ${level}` : BUILDINGS[required].label,
    )
    .join(", ");
}

const cellClass = "px-2 py-1.5 text-left align-top";
const headClass = `${cellClass} font-bold text-(--gray-700)`;

function DetailTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: Array<{ key: string; cells: React.ReactNode[]; highlight?: boolean }>;
}) {
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-(--gray-100)">
      <table className="w-full border-collapse font-(--mono) text-[0.72rem] text-(--gray-600)">
        <thead className="bg-(--gray-50)">
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col" className={headClass}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.key}
              className={`border-t border-(--gray-100) ${row.highlight ? "bg-(--accent-bg) text-(--gray-900)" : ""}`}
            >
              {row.cells.map((cell, index) => (
                <td key={index} className={cellClass}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BuildingDetail({
  type,
  level,
  plannedLevel,
}: {
  type: BuildingType;
  level: number;
  plannedLevel: number;
}) {
  const definition = BUILDINGS[type];
  const requirements = describeRequirements(type);
  const maxLevel = definition.maxLevel;
  const firstLevel = plannedLevel + 1;
  const lastLevel =
    maxLevel === undefined
      ? firstLevel + LEVELS_SHOWN - 1
      : Math.min(maxLevel, firstLevel + LEVELS_SHOWN - 1);
  const levels: number[] = [];
  for (let next = firstLevel; next <= lastLevel; next += 1) levels.push(next);

  return (
    <>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[0.8rem]">
        <dt className="text-(--gray-500)">Niveau actuel</dt>
        <dd className="m-0 font-bold text-(--gray-900)">
          {level > 0 ? level : "Pas encore construit"}
          {plannedLevel > level && ` (niv. ${plannedLevel} en file)`}
        </dd>
        <dt className="text-(--gray-500)">Effet actuel</dt>
        <dd className="m-0 text-(--gray-900)">{levelEffect(type, level)}</dd>
        {maxLevel !== undefined && (
          <>
            <dt className="text-(--gray-500)">Niveau maximal</dt>
            <dd className="m-0 text-(--gray-900)">{maxLevel}</dd>
          </>
        )}
        {requirements && (
          <>
            <dt className="text-(--gray-500)">Nécessite</dt>
            <dd className="m-0 text-(--gray-900)">{requirements}</dd>
          </>
        )}
      </dl>

      {levels.length > 0 ? (
        <DetailTable
          headers={["Niveau", "Coût", "Durée", "Effet"]}
          rows={levels.map((next) => ({
            key: String(next),
            highlight: next === firstLevel,
            cells: [
              next,
              formatResources(getBuildingCost(type, next)),
              formatDuration(getBuildingConstructionMs(type, next)),
              levelEffect(type, next),
            ],
          }))}
        />
      ) : (
        <p className="mt-4 text-[0.8rem] text-(--gray-600)">
          Ce bâtiment a atteint son niveau maximal.
        </p>
      )}
    </>
  );
}

function CompanionDetail() {
  const stageBonus = (stage: (typeof COMPANION_STAGES)[number]) => {
    const bonus = stage === "child" ? 0 : COMPANION_STAGE_HARVEST_BONUS[stage];
    return bonus > 0 ? `+${bonus} ⬡ / ${SECONDS} s` : "—";
  };

  return (
    <>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[0.8rem]">
        <dt className="text-(--gray-500)">Coût</dt>
        <dd className="m-0 text-(--gray-900)">
          {formatResources({ offlinium: COMPANION_INVOCATION_COST })}
        </dd>
        <dt className="text-(--gray-500)">Invocation</dt>
        <dd className="m-0 text-(--gray-900)">
          {formatDuration(COMPANION_INVOCATION_OFFLINE_MS)}
        </dd>
        <dt className="text-(--gray-500)">Place</dt>
        <dd className="m-0 text-(--gray-900)">
          1 place de maison ({COMPANIONS_PER_HOUSE} par niveau)
        </dd>
      </dl>
      <DetailTable
        headers={["Stade", "Dès", "Bonus de récolte"]}
        rows={COMPANION_STAGES.map((stage) => ({
          key: stage,
          cells: [
            COMPANION_STAGE_LABELS[stage],
            stage === "child"
              ? "Naissance"
              : `${COMPANION_STAGE_AGE_MS[stage] / 3_600_000} h hors ligne`,
            stageBonus(stage),
          ],
        }))}
      />
    </>
  );
}

export default function ElementDetailModal({
  target,
  getLevel,
  getPlannedLevel,
  onClose,
}: ElementDetailModalProps) {
  const isCompanion = target === "companion";
  const title =
    target === null
      ? ""
      : isCompanion
        ? "🐾 Compagnon"
        : `${BUILDINGS[target].icon} ${BUILDINGS[target].label}`;
  const message =
    target === null
      ? ""
      : isCompanion
        ? "Un compagnon vieillit pendant votre temps hors ligne et accélère la récolte à mesure qu'il évolue, jusqu'à sa mort."
        : BUILDINGS[target].description;

  return (
    <Modal
      isOpen={target !== null}
      title={title}
      message={message}
      onClose={onClose}
      size="lg"
    >
      {target !== null &&
        (isCompanion ? (
          <CompanionDetail />
        ) : (
          <BuildingDetail
            type={target}
            level={getLevel(target)}
            plannedLevel={getPlannedLevel(target)}
          />
        ))}
      <div className="mt-5 flex justify-end">
        <button
          type="button"
          className="min-h-10 cursor-pointer rounded-[10px] border border-gray-200 bg-gray-50 px-3.5 py-2 text-[0.8rem] font-bold text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
          onClick={onClose}
          autoFocus
        >
          Fermer
        </button>
      </div>
    </Modal>
  );
}
