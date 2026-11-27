import { useState } from "react";
import { useUser } from "../../stores/userStore";
import type { ExplorationPlan, User } from "../../models/user";
import { RESOURCE_ICONS, formatAmount, formatResources, missingResources } from "../../models/resources";
import { EXPLORATION_FUEL, MAX_RESCUED_INHABITANTS } from "../../utils/constants";
import { formatWait } from "../../utils/format";

function describeBlocker(plan: ExplorationPlan, user: User): string | null {
  switch (plan.blocker) {
    case null:
      return null;
    case "noSpaceport":
      return `Construisez un spatioport sur ${plan.from.planet.name} pour explorer.`;
    case "busy":
      return "Un vaisseau explore déjà l'inconnu : attendez son retour.";
    case "resources":
      return `Il vous manque ${formatResources(missingResources(user.getResources(plan.from), plan.cost))}.`;
  }
}

/** Sends a ship into the unknown from one of the player's spaceports. */
export default function ExplorationPanel() {
  const user = useUser((state) => state.user);
  const launchExploration = useUser((state) => state.launchExploration);
  const [chosenFromId, setChosenFromId] = useState<string | null>(null);

  const ports = user.colonies.filter((colony) => colony.planet.levels.spaceport > 0);
  const fromId =
    ports.find((colony) => colony.id === chosenFromId)?.id ??
    ports.find((colony) => colony.id === user.activeColonyId)?.id ??
    ports[0]?.id ??
    user.activeColonyId;
  const plan = user.planExploration(fromId);
  if (!plan) return null;

  const blocker = describeBlocker(plan, user);
  const rescued = user.rescuedNotables.length;

  return (
    <section
      className="flex w-full flex-col gap-2.5 rounded-2xl border border-(--accent-border) bg-(--accent-bg) p-3"
      aria-label="Explorer l'inconnu"
    >
      <h3 className="m-0 text-[0.95rem] font-extrabold text-(--gray-900)">🌌 Explorer l&apos;inconnu</h3>
      <p className="m-0 text-[0.76rem] leading-snug text-(--gray-700)">
        Un vaisseau part au-delà des cartes et rapporte ce qu&apos;il trouve : du métal, de
        l&apos;Offlinium, une épave, un rescapé… ou rien du tout. Une seule exploration à la fois.
      </p>

      {ports.length > 1 && (
        <label className="flex flex-col gap-1 text-[0.72rem] font-bold text-(--gray-700)">
          Départ
          <select
            className="min-h-10 w-full rounded-[10px] border border-(--gray-200) bg-(--surface) px-2.5 font-(--mono) text-[0.85rem] text-(--gray-900) outline-offset-1 focus:outline-2 focus:outline-(--accent-border)"
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

      <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[0.76rem]">
        <dt className="text-(--gray-500)">Départ</dt>
        <dd className="m-0 text-(--gray-900)">{plan.from.planet.name}</dd>
        <dt className="text-(--gray-500)">Retour</dt>
        <dd className="m-0 font-(--mono) text-(--gray-900)">⏱️ {formatWait(plan.flightMs)}</dd>
        <dt className="text-(--gray-500)">Carburant</dt>
        <dd
          className={`m-0 font-(--mono) ${plan.blocker === "resources" ? "text-(--red-dark)" : "text-(--gray-900)"}`}
        >
          {formatAmount(EXPLORATION_FUEL)} {RESOURCE_ICONS.offlinium}
        </dd>
        <dt className="text-(--gray-500)">Rescapés</dt>
        <dd className="m-0 font-(--mono) text-(--gray-900)">
          {rescued} / {MAX_RESCUED_INHABITANTS}
        </dd>
      </dl>

      {blocker && <p className="m-0 text-[0.74rem] leading-snug text-(--gray-700)">{blocker}</p>}
      <button
        type="button"
        className="min-h-10 cursor-pointer rounded-[10px] border-0 bg-(--accent-solid) px-3 text-[0.82rem] font-bold text-(--on-color) disabled:cursor-not-allowed disabled:opacity-50"
        disabled={plan.blocker !== null}
        onClick={() => launchExploration(plan.from.id)}
      >
        Lancer l&apos;exploration
      </button>
    </section>
  );
}
