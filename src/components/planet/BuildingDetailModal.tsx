import Modal from "../ui/Modal";
import {
  BUILDINGS,
  SOLAR_ENERGY_PER_LEVEL,
  getBuildingCost,
  getConstructionMs,
  type BuildingType,
} from "../../models/buildings";
import { ENERGY_ICON, formatResources } from "../../models/resources";
import {
  describeBuildingEffect,
  describeEnergyUse,
  describeStaff,
} from "../../utils/buildingEffects";
import { formatDuration } from "../../utils/format";

/** How many upcoming levels the table shows. */
const LEVELS_SHOWN = 5;

interface BuildingDetailModalProps {
  type: BuildingType | null;
  level: number;
  onClose: () => void;
}

const cellClass = "px-2 py-1.5 text-left align-top whitespace-nowrap";

export default function BuildingDetailModal({
  type,
  level,
  onClose,
}: BuildingDetailModalProps) {
  const definition = type ? BUILDINGS[type] : null;
  const levels = Array.from({ length: LEVELS_SHOWN }, (_, index) => level + 1 + index);

  return (
    <Modal
      isOpen={type !== null}
      title={definition ? `${definition.icon} ${definition.label}` : ""}
      message={definition?.description ?? ""}
      onClose={onClose}
      size="lg"
    >
      {type !== null && (
        <>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[0.8rem]">
            <dt className="text-(--gray-500)">Niveau actuel</dt>
            <dd className="m-0 font-bold text-(--gray-900)">
              {level > 0 ? level : "Pas encore construit"}
            </dd>
            <dt className="text-(--gray-500)">Effet actuel</dt>
            <dd className="m-0 text-(--gray-900)">
              {describeBuildingEffect(type, level)}
            </dd>
            <dt className="text-(--gray-500)">Énergie consommée</dt>
            <dd className="m-0 text-(--gray-900)">{describeEnergyUse(type, level)}</dd>
            <dt className="text-(--gray-500)">Personnel requis</dt>
            <dd className="m-0 text-(--gray-900)">{describeStaff(type, level)}</dd>
          </dl>

          <div className="mt-4 overflow-x-auto rounded-xl border border-(--gray-100)">
            <table className="w-full border-collapse font-(--mono) text-[0.72rem] text-(--gray-600)">
              <thead className="bg-(--gray-50)">
                <tr>
                  {["Niv.", "Coût", "Durée", "Effet", "Énergie", "Personnel"].map(
                    (header) => (
                      <th
                        key={header}
                        scope="col"
                        className={`${cellClass} font-bold text-(--gray-700)`}
                      >
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {levels.map((next, index) => (
                  <tr
                    key={next}
                    className={`border-t border-(--gray-100) ${index === 0 ? "bg-(--accent-bg) text-(--gray-900)" : ""}`}
                  >
                    <td className={cellClass}>{next}</td>
                    <td className={cellClass}>{formatResources(getBuildingCost(type, next))}</td>
                    <td className={cellClass}>{formatDuration(getConstructionMs(type, next))}</td>
                    <td className={cellClass}>{describeBuildingEffect(type, next)}</td>
                    <td className={cellClass}>{describeEnergyUse(type, next)}</td>
                    <td className={cellClass}>{describeStaff(type, next)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[0.72rem] text-(--gray-500)">
            Chaque niveau occupe une case et porte aussi des panneaux solaires :
            +{SOLAR_ENERGY_PER_LEVEL} {ENERGY_ICON}.
          </p>
        </>
      )}
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
