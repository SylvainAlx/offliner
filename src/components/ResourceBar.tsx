import { useOnlineStatus } from "../stores/onlineStatusStore";
import { useUser } from "../stores/userStore";
import {
  ENERGY_ICON,
  POPULATION_ICON,
  RESOURCE_ICONS,
  RESOURCE_LABELS,
  RESOURCE_TYPES,
  formatAmount,
} from "../models/resources";

const chipClass =
  "inline-flex items-center gap-1 rounded-full border border-(--gray-200) bg-white px-2.5 py-1 shadow-(--shadow-sm) font-(--mono) text-[0.8rem] text-(--gray-900)";

/** Stocks, energy balance and population, always in sight. */
export default function ResourceBar() {
  const isOnline = useOnlineStatus((state) => state.isOnline);
  const user = useUser((state) => state.user);
  // Metal, food, energy and population are the planet's; Offlinium, the player's.
  const colony = user.activeColony;
  const resources = user.getResources(colony);
  const economy = colony.economy;
  const energyBalance = economy.energyProduced - economy.energyConsumed;

  return (
    <div
      className="flex flex-wrap justify-start gap-1.5"
      aria-label="Ressources"
    >
      {RESOURCE_TYPES.map((type) => {
        // Offlinium is never capped; metal and food stop at the depot's capacity.
        const capped = type !== "offlinium";
        const isFull = capped && resources[type] >= economy.storageCapacity;
        const amount = formatAmount(resources[type]);
        const capacity = formatAmount(economy.storageCapacity);
        return (
          <span
            key={type}
            className={`${chipClass} ${
              type === "offlinium" && !isOnline
                ? "border-(--accent-border) bg-(--accent-bg) shadow-[0_0_12px_rgba(170,59,255,0.2)]"
                : ""
            } ${isFull ? "border-(--warning-border) bg-(--warning-bg) text-(--warning-text)" : ""}`}
            title={
              capped
                ? `${RESOURCE_LABELS[type]} : ${amount} / ${capacity}${isFull ? " (dépôt plein)" : ""}`
                : RESOURCE_LABELS[type]
            }
            aria-label={
              capped
                ? `${amount} ${RESOURCE_LABELS[type]} sur ${capacity}${isFull ? ", dépôt plein" : ""}`
                : `${amount} ${RESOURCE_LABELS[type]}`
            }
          >
            <span aria-hidden="true">{RESOURCE_ICONS[type]}</span>
            {amount}
            {isFull && <span aria-hidden="true">·max</span>}
          </span>
        );
      })}
      <span
        className={`${chipClass} ${energyBalance < 0 ? "text-(--red-dark)" : ""}`}
        title="Énergie disponible (produite − consommée)"
        aria-label={`Énergie : ${formatAmount(energyBalance)}`}
      >
        <span aria-hidden="true">{ENERGY_ICON}</span>
        {energyBalance < 0 ? "−" : ""}
        {formatAmount(Math.abs(energyBalance))}
      </span>
      <span
        className={chipClass}
        title="Population / maximum"
        aria-label={`Population : ${Math.floor(colony.population)} sur ${formatAmount(economy.populationMax)}`}
      >
        <span aria-hidden="true">{POPULATION_ICON}</span>
        {Math.floor(colony.population)}/{formatAmount(economy.populationMax)}
      </span>
    </div>
  );
}
