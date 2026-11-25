import { useActiveColony, useUser } from "../../stores/userStore";
import { getPopulationMax } from "../../models/buildings";
import { getPopulationTrend, predictFoodRunOutMs } from "../../models/economy";
import { POPULATION_ICON, RESOURCE_ICONS, formatAmount } from "../../models/resources";
import {
  FOOD_PER_INHABITANT_PER_HOUR,
  POPULATION_GROWTH_PER_HOUR,
  STARVATION_LOSS_PER_HOUR,
} from "../../utils/constants";
import { formatLength } from "../../utils/format";
import PlanetSection from "../PlanetSection";

function formatRate(perHour: number): string {
  const rounded = Math.round(Math.abs(perHour) * 10) / 10;
  return rounded.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
}

const noteClass = "m-0 rounded-lg border px-2.5 py-2 text-[0.76rem] leading-snug";
const infoNote = `${noteClass} border-(--green-bg) bg-(--green-bg) text-(--gray-800)`;
const warningNote = `${noteClass} border-(--warning-border) bg-(--warning-bg) text-(--warning-text)`;
const dangerNote = `${noteClass} border-(--red-border) bg-(--red-bg) text-(--red-dark)`;

/** Where the population stands, where it is heading, and why. */
export default function PopulationPanel() {
  const colony = useActiveColony();
  const economy = colony.economy;
  const habitatLevel = colony.planet.levels.habitat;
  const population = Math.floor(colony.population);
  const max = economy.populationMax;
  const trend = getPopulationTrend(economy, colony.population, colony.resources.food);
  const now = useUser((state) => state.user.realTimeSettledAt);
  const foodRunsOutInMs = predictFoodRunOutMs(colony, now);
  const share = max > 0 ? Math.min(100, (colony.population / max) * 100) : 0;
  const foodBalance = economy.foodPerHour - economy.foodEatenPerHour;

  return (
    <PlanetSection
      title="Population"
      subtitle="Les habitants font tourner les bâtiments."
    >
      <div className="flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <strong className="font-(--mono) text-[1.1rem] text-(--gray-900)">
            {POPULATION_ICON} {population} / {formatAmount(max)}
          </strong>
          <span className="font-(--mono) text-[0.78rem] text-(--gray-600)">
            {trend.status === "growing" && `+${formatRate(trend.perHour)} /h`}
            {trend.status === "starving" && `−${formatRate(trend.perHour)} /h`}
            {trend.status === "full" && "maximum atteint"}
          </span>
        </div>
        <span
          className="block h-2 w-full overflow-hidden rounded-full bg-(--gray-200)"
          role="progressbar"
          aria-label="Population par rapport au maximum"
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={population}
        >
          <span
            className={`block h-full rounded-[inherit] transition-[width] duration-300 ${
              trend.status === "starving" ? "bg-(--red-primary)" : "bg-(--green-primary)"
            }`}
            style={{ width: `${share}%` }}
          />
        </span>

        {trend.status === "growing" && (
          <p className={infoNote}>
            La population grandit de <strong>{formatRate(trend.perHour)} habitant
            {trend.perHour >= 2 ? "s" : ""} par heure</strong>
            {trend.timeToFullMs !== null &&
              ` : maximum atteint dans ${formatLength(trend.timeToFullMs)}`}
            .
            {economy.energyFactor < 1 &&
              ` Le manque d'énergie la ralentit : elle irait à ${formatRate(trend.fullEnergyPerHour)} /h avec assez d'énergie.`}
          </p>
        )}
        {trend.status === "full" && (
          <p className={infoNote}>
            L&apos;habitat est plein. Pour accueillir plus d&apos;habitants,
            améliorez-le : au niveau {habitatLevel + 1}, le maximum passe à{" "}
            {formatAmount(getPopulationMax(habitatLevel + 1))}.
          </p>
        )}
        {trend.status === "starving" && (
          <p className={dangerNote}>
            Famine : il n&apos;y a plus d&apos;alimentation et la ferme ne suffit
            pas. La population perd {Math.round(STARVATION_LOSS_PER_HOUR * 100)} %
            par heure jusqu&apos;à ce que la production couvre ce que mangent les
            habitants.
          </p>
        )}
        {foodRunsOutInMs !== null && (
          <p className={warningNote}>
            Les habitants mangent plus que ce qui est produit (
            {formatAmount(Math.abs(foodBalance))} {RESOURCE_ICONS.food}/h de
            déficit) : réserves épuisées dans {formatLength(foodRunsOutInMs)},
            puis famine. Améliorez la ferme.
          </p>
        )}

        <details className="rounded-lg border border-(--gray-200) bg-(--surface) px-2.5 py-2 text-[0.76rem] text-(--gray-700)">
          <summary className="cursor-pointer font-bold text-(--gray-900)">
            Comment la population évolue
          </summary>
          <ul className="mt-2 mb-0 flex list-disc flex-col gap-1 pl-4 leading-snug">
            <li>
              Le <strong>maximum</strong> dépend de l&apos;habitat : 10 au
              départ, puis il augmente à chaque niveau.
            </li>
            <li>
              Tant que le maximum n&apos;est pas atteint, la population{" "}
              <strong>grandit en temps réel</strong> de{" "}
              {Math.round(POPULATION_GROWTH_PER_HOUR * 100)} % du maximum par
              heure (au moins 1 habitant), même application fermée.
            </li>
            <li>
              Les habitats consomment de l&apos;énergie : s&apos;il en manque, la
              croissance ralentit dans la même proportion.
            </li>
            <li>
              Chaque habitant <strong>mange {FOOD_PER_INHABITANT_PER_HOUR}{" "}
              {RESOURCE_ICONS.food} par heure</strong>. Sans réserves et sans
              production suffisante, c&apos;est la famine : −
              {Math.round(STARVATION_LOSS_PER_HOUR * 100)} % d&apos;habitants
              par heure.
            </li>
            <li>
              Les habitants servent de <strong>personnel</strong> : il en faut{" "}
              {economy.staffRequired} pour vos bâtiments actuels. S&apos;il en
              manque, les bâtiments tournent au ralenti.
            </li>
          </ul>
        </details>
      </div>
    </PlanetSection>
  );
}
