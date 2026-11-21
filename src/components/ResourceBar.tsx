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
  const economy = user.economy;
  const energyBalance = economy.energyProduced - economy.energyConsumed;

  return (
    <div
      className="flex flex-wrap justify-start gap-1.5"
      aria-label="Ressources"
    >
      {RESOURCE_TYPES.map((type) => (
        <span
          key={type}
          className={`${chipClass} ${
            type === "offlinium" && !isOnline
              ? "border-[rgba(170,59,255,0.4)] bg-[rgba(245,235,255,0.8)] shadow-[0_0_12px_rgba(170,59,255,0.2)]"
              : ""
          }`}
          title={RESOURCE_LABELS[type]}
          aria-label={`${formatAmount(user.resources[type])} ${RESOURCE_LABELS[type]}`}
        >
          <span aria-hidden="true">{RESOURCE_ICONS[type]}</span>
          {formatAmount(user.resources[type])}
        </span>
      ))}
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
        aria-label={`Population : ${Math.floor(user.population)} sur ${formatAmount(economy.populationMax)}`}
      >
        <span aria-hidden="true">{POPULATION_ICON}</span>
        {Math.floor(user.population)}/{formatAmount(economy.populationMax)}
      </span>
    </div>
  );
}
