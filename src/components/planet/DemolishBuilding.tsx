import { useState } from "react";
import { useUser } from "../../stores/userStore";
import { BUILDINGS, type BuildingType } from "../../models/buildings";
import { formatAmount, formatResources } from "../../models/resources";
import { describeBuildingEffect } from "../../utils/buildingEffects";

const percent = (factor: number) => `${Math.round(factor * 100)} %`;

/** Takes a building back one level, refunding what that level cost. */
export default function DemolishBuilding({ type }: { type: BuildingType }) {
  const user = useUser((state) => state.user);
  const demolishBuilding = useUser((state) => state.demolishBuilding);
  const [isConfirming, setIsConfirming] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const colony = user.activeColony;
  const level = colony.planet.levels[type];

  if (level <= 0) {
    return done ? (
      <p className="m-0 mt-4 text-[0.78rem] text-(--green-dark)" role="status">
        {done}
      </p>
    ) : null;
  }

  const blocker = user.getDemolitionBlocker(type, colony);
  const refund = user.getDemolitionRefund(type, colony);
  const preview = colony.previewDemolition(type);
  const definition = BUILDINGS[type];

  const consequences: string[] = [];
  if (preview.inhabitantsLeaving > 0) {
    consequences.push(
      `👥 ${formatAmount(preview.inhabitantsLeaving)} habitant${preview.inhabitantsLeaving > 1 ? "s" : ""} sans logement quitteront la planète.`,
    );
  }
  if (preview.shortage) {
    consequences.push(
      `⚙️ Faute ${preview.shortage === "energy" ? "d'énergie" : "de personnel"}, les bâtiments tourneront à ${percent(preview.productionFactorAfter)} (contre ${percent(preview.productionFactorBefore)}).`,
    );
  }
  if (preview.startsFoodDeficit) {
    consequences.push("🌾 La production d'aliments ne suffira plus à nourrir la population.");
  }
  if (preview.storageCapacityExceeded !== null) {
    consequences.push(
      `📦 Les stocks au-delà de ${formatAmount(preview.storageCapacityExceeded)} sont gardés, mais ne grandiront plus.`,
    );
  }
  if (type === "radar" && preview.level === 0) {
    consequences.push("📡 Plus d'émission ni de réception de signaux. Le journal est conservé.");
  }
  if (type === "spaceport") {
    consequences.push(
      preview.level === 0
        ? "🚀 Plus d'expéditions depuis cette planète. Celles déjà en vol arriveront."
        : "🚀 La portée des expéditions diminue. Celles déjà en vol arriveront.",
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-(--red-border) p-3">
      {!isConfirming ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="m-0 text-[0.78rem] text-(--gray-600)">
            {done ?? `Démolir le niveau ${level} rend ${formatResources(refund)}.`}
          </p>
          <button
            type="button"
            className="min-h-10 cursor-pointer rounded-[10px] border border-(--red-border) bg-transparent px-3.5 text-[0.8rem] font-bold text-(--red-dark) hover:bg-(--red-bg) disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
            disabled={blocker !== null}
            onClick={() => {
              setDone(null);
              setIsConfirming(true);
            }}
          >
            Démolir un niveau
          </button>
          {blocker === "underConstruction" && (
            <p className="m-0 basis-full text-[0.74rem] text-(--gray-600)">
              Le niveau suivant est en chantier : annulez-le d'abord pour démolir.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-2 text-[0.8rem] text-(--gray-800)">
          <p className="m-0">
            <strong>
              {definition.icon} {definition.label} : niveau {level} → {preview.level}
            </strong>
          </p>
          <p className="m-0">
            Récupéré tout de suite : <strong>{formatResources(refund)}</strong>. Une case
            se libère.
          </p>
          <p className="m-0 text-(--gray-600)">
            Effet après démolition : {describeBuildingEffect(type, preview.level)}
          </p>
          {consequences.length > 0 && (
            <ul className="m-0 grid list-none gap-1 rounded-[10px] bg-(--red-bg) p-2.5 text-[0.76rem] text-(--red-dark)">
              {consequences.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className="min-h-10 cursor-pointer rounded-[10px] border border-(--gray-200) bg-(--gray-50) px-3.5 text-[0.8rem] font-bold text-(--gray-700)"
              onClick={() => setIsConfirming(false)}
            >
              Annuler
            </button>
            <button
              type="button"
              className="min-h-10 cursor-pointer rounded-[10px] border-0 bg-(--red-solid) px-3.5 text-[0.8rem] font-bold text-(--on-color) disabled:cursor-not-allowed disabled:opacity-50"
              disabled={blocker !== null}
              onClick={() => {
                if (demolishBuilding(type)) {
                  setDone(`Niveau ${level} démoli : ${formatResources(refund)} récupérés.`);
                }
                setIsConfirming(false);
              }}
            >
              Démolir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
