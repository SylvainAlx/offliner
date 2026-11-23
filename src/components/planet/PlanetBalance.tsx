import { useUser } from "../../stores/userStore";
import {
  ENERGY_ICON,
  RESOURCE_ICONS,
  RESOURCE_LABELS,
  formatAmount,
} from "../../models/resources";
import { OFFLINIUM_PER_HOUR } from "../../utils/constants";
import PlanetSection from "../PlanetSection";

function percent(value: number): string {
  return `${Math.round(value * 100)} %`;
}

/** How the planet is doing: production, storage, energy, staff. */
export default function PlanetBalance() {
  const user = useUser((state) => state.user);
  const colony = user.activeColony;
  const economy = colony.economy;
  const population = Math.floor(colony.population);
  const foodBalance = economy.foodPerHour - economy.foodEatenPerHour;
  const warnings: string[] = [];
  if (economy.energyFactor < 1) {
    warnings.push(
      `Énergie insuffisante : les bâtiments tournent à ${percent(economy.energyFactor)} et la population grandit moins vite. Montez le réacteur.`,
    );
  }
  if (economy.staffFactor < 1) {
    warnings.push(
      `Personnel insuffisant : ${population} habitants pour ${economy.staffRequired} postes. Agrandissez l'habitat.`,
    );
  }
  // Food and growth are explained in the Population section.
  const full = (["metal", "food"] as const).filter(
    (type) => colony.resources[type] >= economy.storageCapacity,
  );
  if (full.length > 0) {
    warnings.push(
      `Dépôt plein (${full.map((type) => RESOURCE_LABELS[type].toLowerCase()).join(" et ")}) : ce qui est produit en plus est perdu. Améliorez le dépôt.`,
    );
  }

  const rows: Array<[string, string]> = [
    ["Cases", `${colony.planet.usedFields} / ${colony.planet.fields}`],
    [
      "Dépôt",
      `${formatAmount(economy.storageCapacity)} ${RESOURCE_ICONS.metal} et ${formatAmount(economy.storageCapacity)} ${RESOURCE_ICONS.food} max`,
    ],
    ["Métal", `+${formatAmount(economy.metalPerHour)} ${RESOURCE_ICONS.metal}/h`],
    [
      "Alimentation",
      `${foodBalance >= 0 ? "+" : "−"}${formatAmount(Math.abs(foodBalance))} ${RESOURCE_ICONS.food}/h (${formatAmount(economy.foodPerHour)} produits, ${formatAmount(economy.foodEatenPerHour)} mangés)`,
    ],
    [
      "Énergie",
      `${formatAmount(economy.energyProduced)} produits / ${formatAmount(economy.energyConsumed)} consommés ${ENERGY_ICON}`,
    ],
    ["Personnel", `${economy.staffRequired} postes pour ${population} habitants`],
    ["Rendement", percent(economy.productionFactor)],
    [
      "Offlinium hors ligne",
      // Every planet's laboratory counts: this is the player's rate.
      `${formatAmount(OFFLINIUM_PER_HOUR * user.offliniumMultiplier)} ${RESOURCE_ICONS.offlinium}/h`,
    ],
  ];

  return (
    <PlanetSection title="Bilan de la planète">
      {warnings.length > 0 && (
        <ul className="m-0 mb-3 flex list-none flex-col gap-1.5 p-0">
          {warnings.map((warning) => (
            <li
              key={warning}
              className="rounded-lg border border-(--warning-border) bg-(--warning-bg) px-2.5 py-2 text-[0.74rem] text-(--warning-text)"
            >
              ⚠️ {warning}
            </li>
          ))}
        </ul>
      )}
      <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[0.76rem]">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-(--gray-500)">{label}</dt>
            <dd className="m-0 font-(--mono) text-(--gray-900)">{value}</dd>
          </div>
        ))}
      </dl>
    </PlanetSection>
  );
}
