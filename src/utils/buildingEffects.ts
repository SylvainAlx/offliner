import {
  BUILDINGS,
  LABORATORY_BONUS_PER_LEVEL,
  describeSettlement,
  getPopulationMax,
  type BuildingType,
} from "../models/buildings";
import {
  ENERGY_ICON,
  POPULATION_ICON,
  RESOURCE_ICONS,
  formatAmount,
} from "../models/resources";

/** What a building gives at a level, at full production. */
export function describeBuildingEffect(type: BuildingType, level: number): string {
  if (level <= 0 && type !== "habitat") return "—";
  const definition = BUILDINGS[type];
  switch (type) {
    case "metalMine":
      return `+${formatAmount(definition.production(level).metal ?? 0)} ${RESOURCE_ICONS.metal}/h`;
    case "farm":
      return `+${formatAmount(definition.production(level).food ?? 0)} ${RESOURCE_ICONS.food}/h`;
    case "reactor":
      return `+${formatAmount(definition.energyProduced(level))} ${ENERGY_ICON}`;
    case "laboratory":
      return `+${Math.round(LABORATORY_BONUS_PER_LEVEL * level * 100)} % ${RESOURCE_ICONS.offlinium}`;
    case "habitat":
      return `${formatAmount(getPopulationMax(level))} ${POPULATION_ICON} max (${describeSettlement(level)})`;
  }
}

export function describeEnergyUse(type: BuildingType, level: number): string {
  const used = BUILDINGS[type].energyConsumed(level);
  return used > 0 ? `${formatAmount(used)} ${ENERGY_ICON}` : "—";
}

export function describeStaff(type: BuildingType, level: number): string {
  const staff = BUILDINGS[type].staff(level);
  return staff > 0 ? `${staff} ${POPULATION_ICON}` : "—";
}
