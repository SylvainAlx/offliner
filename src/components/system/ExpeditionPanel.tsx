import { useState } from "react";
import { useUser } from "../../stores/userStore";
import type { User, ExpeditionPlan } from "../../models/user";
import type { SystemPlanet } from "../../models/starSystem";
import type { ExpeditionCargo, ExpeditionKind } from "../../models/expedition";
import {
  RESOURCE_ICONS,
  RESOURCE_LABELS,
  formatAmount,
  formatResources,
  missingResources,
  nonZeroResources,
} from "../../models/resources";
import { COLONISTS_PER_SHIP, MAX_COLONIES } from "../../utils/constants";
import { formatLength } from "../../utils/format";

function formatAu(value: number): string {
  return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} UA`;
}

function describeBlocker(plan: ExpeditionPlan, user: User): string | null {
  const from = plan.from.planet.name;
  switch (plan.blocker) {
    case null:
      return null;
    case "noSpaceport":
      return `Construisez un spatioport sur ${from} pour lancer des expéditions d'ici.`;
    case "samePlanet":
      return "C'est le point de départ.";
    case "notColonizable":
      return "Une géante gazeuse n'a pas de sol où s'installer.";
    case "occupied":
      return "Cette planète est déjà colonisée, ou une expédition est en route vers elle.";
    case "maxColonies":
      return `Vous avez atteint le maximum de ${MAX_COLONIES} colonies.`;
    case "notOwned":
      return "Le cargo ne livre que vos propres planètes.";
    case "outOfRange":
      return `Hors de portée : ${formatAu(plan.distanceAu)} pour ${formatAu(plan.rangeAu)} de portée. Il faut un spatioport de niveau ${plan.requiredLevel} sur ${from}.`;
    case "colonists":
      return `Il faut plus de ${COLONISTS_PER_SHIP} habitants sur ${from} : ${COLONISTS_PER_SHIP} partent, au moins un reste.`;
    case "emptyCargo":
      return "Choisissez ce que le cargo emporte.";
    case "capacity":
      return `Le cargo emporte au plus ${formatAmount(plan.capacity)} unités.`;
    case "resources":
      return `Il vous manque ${formatResources(missingResources(user.getResources(plan.from), plan.cost))}.`;
  }
}

const inputClass =
  "min-h-10 w-full rounded-[10px] border border-(--gray-200) bg-(--surface) px-2.5 font-(--mono) text-[0.85rem] text-(--gray-900) outline-offset-1 focus:outline-2 focus:outline-(--accent-border)";

function CargoInputs({
  cargo,
  available,
  capacity,
  onChange,
}: {
  cargo: ExpeditionCargo;
  available: ExpeditionCargo;
  capacity: number;
  onChange: (cargo: ExpeditionCargo) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {(["metal", "food"] as const).map((type) => {
        const other = type === "metal" ? cargo.food : cargo.metal;
        const max = Math.max(0, Math.min(Math.floor(available[type]), capacity - other));
        return (
          <label key={type} className="flex flex-col gap-1 text-[0.72rem] font-bold text-(--gray-700)">
            <span>
              {RESOURCE_ICONS[type]} {RESOURCE_LABELS[type]}
            </span>
            <span className="flex gap-1">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={100}
                className={inputClass}
                value={cargo[type] || ""}
                placeholder="0"
                onChange={(event) =>
                  onChange({ ...cargo, [type]: Math.max(0, Math.floor(Number(event.target.value) || 0)) })
                }
              />
              <button
                type="button"
                className="min-h-10 shrink-0 cursor-pointer rounded-[10px] border border-(--gray-200) bg-(--gray-50) px-2 text-[0.7rem] font-bold text-(--gray-700) hover:bg-(--gray-100)"
                onClick={() => onChange({ ...cargo, [type]: max })}
                aria-label={`Charger le maximum de ${RESOURCE_LABELS[type].toLowerCase()}`}
              >
                max
              </button>
            </span>
          </label>
        );
      })}
    </div>
  );
}

/** Sends a colony ship or a cargo from one of the player's spaceports. */
export default function ExpeditionPanel({ target }: { target: SystemPlanet }) {
  const user = useUser((state) => state.user);
  const launchExpedition = useUser((state) => state.launchExpedition);
  const [cargo, setCargo] = useState<ExpeditionCargo>({ metal: 0, food: 0 });
  const [chosenFromId, setChosenFromId] = useState<string | null>(null);
  const [launched, setLaunched] = useState<string | null>(null);

  const destination = user.getColonyAt(target.id);
  const kind: ExpeditionKind = destination ? "cargo" : "colonization";
  // Departure: a planet with a spaceport, the one shown first if it has one.
  const ports = user.colonies.filter(
    (colony) => colony.planet.levels.spaceport > 0 && colony.systemPlanetId !== target.id,
  );
  const fromId =
    ports.find((colony) => colony.id === chosenFromId)?.id ??
    ports.find((colony) => colony.id === user.activeColonyId)?.id ??
    ports[0]?.id ??
    // No spaceport yet: the plan says where to build one.
    (user.activeColony.systemPlanetId !== target.id
      ? user.activeColonyId
      : user.colonies.find((colony) => colony.systemPlanetId !== target.id)?.id) ??
    user.activeColonyId;
  const plan = user.planExpedition(kind, fromId, target.id, cargo);

  if (!plan || plan.blocker === "samePlanet") return null;
  if (kind === "colonization" && !target.isColonizable) {
    return (
      <p className="m-0 rounded-xl bg-(--gray-50) p-3 text-[0.78rem] text-(--gray-600)">
        Une géante gazeuse n&apos;a pas de sol où s&apos;installer : on ne peut pas la coloniser.
      </p>
    );
  }

  const blocker = describeBlocker(plan, user);
  if (plan.blocker === "noSpaceport") {
    return (
      <p className="m-0 rounded-xl border border-dashed border-(--accent-border) bg-(--accent-bg) p-3 text-[0.78rem] leading-snug text-(--gray-700)">
        {blocker}
      </p>
    );
  }
  const available = user.getResources(plan.from);
  const missing = missingResources(available, plan.cost);
  const title = kind === "colonization" ? "🚀 Coloniser cette planète" : "📦 Envoyer un cargo";

  function launch() {
    if (!plan) return;
    if (launchExpedition(kind, plan.from.id, target.id, cargo)) {
      setLaunched(
        kind === "colonization"
          ? `Le vaisseau colonial est parti : arrivée dans ${formatLength(plan.flightMs)}.`
          : `Le cargo est parti : livraison dans ${formatLength(plan.flightMs)}.`,
      );
      setCargo({ metal: 0, food: 0 });
    }
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-(--accent-border) bg-(--accent-bg) p-3">
      <strong className="text-[0.88rem] text-(--gray-900)">{title}</strong>

      {ports.length > 1 && (
        <label className="flex flex-col gap-1 text-[0.72rem] font-bold text-(--gray-700)">
          Départ
          <select
            className={inputClass}
            value={plan.from.id}
            onChange={(event) => setChosenFromId(event.target.value)}
          >
            {ports.map((colony) => (
              <option key={colony.id} value={colony.id}>
                {colony.planet.name} (spatioport niv. {colony.planet.levels.spaceport})
              </option>
            ))}
          </select>
        </label>
      )}

      {kind === "cargo" && (
        <CargoInputs
          cargo={cargo}
          available={plan.from.resources}
          capacity={plan.capacity}
          onChange={(next) => {
            setCargo(next);
            setLaunched(null);
          }}
        />
      )}

      <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[0.76rem]">
        <dt className="text-(--gray-500)">Départ</dt>
        <dd className="m-0 text-(--gray-900)">{plan.from.planet.name}</dd>
        <dt className="text-(--gray-500)">Distance</dt>
        <dd className="m-0 font-(--mono) text-(--gray-900)">
          {formatAu(plan.distanceAu)} · portée {formatAu(plan.rangeAu)}
        </dd>
        <dt className="text-(--gray-500)">Vol</dt>
        <dd className="m-0 font-(--mono) text-(--gray-900)">⏱️ {formatLength(plan.flightMs)}</dd>
        <dt className="text-(--gray-500)">Coût</dt>
        <dd className="m-0 flex flex-wrap gap-x-2 font-(--mono)">
          {nonZeroResources(plan.cost).map(([resource, value]) => (
            <span
              key={resource}
              className={missing[resource] ? "text-(--red-dark)" : "text-(--gray-900)"}
              title={resource === "offlinium" ? "Carburant" : RESOURCE_LABELS[resource]}
            >
              {formatAmount(value)} {RESOURCE_ICONS[resource]}
            </span>
          ))}
          {plan.colonists > 0 && <span className="text-(--gray-900)">{plan.colonists} 👥</span>}
        </dd>
        {kind === "colonization" && (
          <>
            <dt className="text-(--gray-500)">À l&apos;arrivée</dt>
            <dd className="m-0 text-(--gray-900)">
              {plan.colonists} colons, {formatResources(plan.cargo)} et un gouverneur
            </dd>
          </>
        )}
        {kind === "cargo" && (
          <>
            <dt className="text-(--gray-500)">Capacité</dt>
            <dd className="m-0 font-(--mono) text-(--gray-900)">
              {formatAmount(cargo.metal + cargo.food)} / {formatAmount(plan.capacity)}
            </dd>
          </>
        )}
      </dl>

      {blocker && !(plan.blocker === "emptyCargo" && launched) && (
        <p className="m-0 text-[0.74rem] leading-snug text-(--gray-700)">{blocker}</p>
      )}
      {launched && (
        <p className="m-0 text-[0.74rem] font-bold text-(--green-dark)" role="status">
          {launched}
        </p>
      )}
      <button
        type="button"
        className="min-h-10 cursor-pointer rounded-[10px] border-0 bg-(--accent-solid) px-3 text-[0.82rem] font-bold text-(--on-color) disabled:cursor-not-allowed disabled:opacity-50"
        disabled={plan.blocker !== null}
        onClick={launch}
      >
        {kind === "colonization" ? "Lancer la colonisation" : "Envoyer le cargo"}
      </button>
    </div>
  );
}
