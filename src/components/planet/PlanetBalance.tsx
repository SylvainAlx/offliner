import { useUser } from "../../stores/userStore";
import { describeSettlement } from "../../models/buildings";
import {
  ENERGY_ICON,
  POPULATION_ICON,
  RESOURCE_ICONS,
  formatAmount,
} from "../../models/resources";
import { OFFLINIUM_DELIVERY_INTERVAL } from "../../utils/constants";
import PlanetSection from "../PlanetSection";

const OFFLINIUM_PER_HOUR = (60 * 60 * 1000) / OFFLINIUM_DELIVERY_INTERVAL;

function percent(value: number): string {
  return `${Math.round(value * 100)} %`;
}

/** How the planet is doing: production, energy, staff, food. */
export default function PlanetBalance() {
  const user = useUser((state) => state.user);
  const economy = user.economy;
  const population = Math.floor(user.population);
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
  if (foodBalance < 0) {
    warnings.push(
      user.resources.food < 1
        ? "Famine : la population diminue. Construisez ou améliorez la ferme."
        : "Les habitants mangent plus que la ferme ne produit : le stock d'alimentation baisse.",
    );
  }

  const rows: Array<[string, string]> = [
    ["Habitat", describeSettlement(user.planet.levels.habitat)],
    ["Population", `${population} / ${formatAmount(economy.populationMax)} ${POPULATION_ICON}`],
    ["Cases", `${user.planet.usedFields} / ${user.planet.fields}`],
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
      `${formatAmount(OFFLINIUM_PER_HOUR * economy.offliniumMultiplier)} ${RESOURCE_ICONS.offlinium}/h`,
    ],
  ];

  return (
    <PlanetSection title="Bilan de la planète">
      {warnings.length > 0 && (
        <ul className="m-0 mb-3 flex list-none flex-col gap-1.5 p-0">
          {warnings.map((warning) => (
            <li
              key={warning}
              className="rounded-lg border border-[#fde68a] bg-[#fffbeb] px-2.5 py-2 text-[0.74rem] text-[#92400e]"
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
