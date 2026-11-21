import { isNonNegativeNumber, isRecord } from "../utils/sanitize";

/** Resources that are stored. Energy is a balance, not a stock. */
export const RESOURCE_TYPES = ["metal", "food", "offlinium"] as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number];

/** A full balance: every resource has a value (fractions accumulate). */
export type Resources = Record<ResourceType, number>;

/** A cost or a refund: missing resources count as 0. */
export type ResourceAmounts = Partial<Record<ResourceType, number>>;

export const RESOURCE_LABELS: Record<ResourceType, string> = {
  metal: "Métal",
  food: "Alimentation",
  offlinium: "Offlinium",
};

export const RESOURCE_ICONS: Record<ResourceType, string> = {
  metal: "🔩",
  food: "🌾",
  offlinium: "⬡",
};

export const ENERGY_ICON = "⚡";
export const POPULATION_ICON = "👥";

export function emptyResources(): Resources {
  return { metal: 0, food: 0, offlinium: 0 };
}

export function addResources(target: Resources, amounts: ResourceAmounts): void {
  for (const type of RESOURCE_TYPES) target[type] += amounts[type] ?? 0;
}

export function subtractResources(target: Resources, amounts: ResourceAmounts): void {
  for (const type of RESOURCE_TYPES) target[type] -= amounts[type] ?? 0;
}

/** Fractions are kept in the balance but only whole units can be spent. */
export function hasResources(available: Resources, cost: ResourceAmounts): boolean {
  return RESOURCE_TYPES.every(
    (type) => Math.floor(available[type]) >= (cost[type] ?? 0),
  );
}

/** What is still missing to pay `cost`, or an empty object when affordable. */
export function missingResources(
  available: Resources,
  cost: ResourceAmounts,
): ResourceAmounts {
  const missing: ResourceAmounts = {};
  for (const type of RESOURCE_TYPES) {
    const lacking = (cost[type] ?? 0) - Math.floor(available[type]);
    if (lacking > 0) missing[type] = lacking;
  }
  return missing;
}

/** The resources of `amounts` that are not zero, in display order. */
export function nonZeroResources(
  amounts: ResourceAmounts,
): Array<[ResourceType, number]> {
  return RESOURCE_TYPES.flatMap((type) => {
    const value = amounts[type] ?? 0;
    return value !== 0 ? [[type, value] as [ResourceType, number]] : [];
  });
}

export function formatAmount(value: number): string {
  return Math.floor(value).toLocaleString("fr-FR");
}

export function formatResources(amounts: ResourceAmounts): string {
  const parts = nonZeroResources(amounts).map(
    ([type, value]) => `${formatAmount(value)} ${RESOURCE_ICONS[type]}`,
  );
  return parts.length > 0 ? parts.join(" · ") : "—";
}

/** Copies only known, non-negative resources. */
export function sanitizeResources(value: unknown): Resources {
  const resources = emptyResources();
  if (!isRecord(value)) return resources;
  for (const type of RESOURCE_TYPES) {
    const amount = value[type];
    if (isNonNegativeNumber(amount)) resources[type] = amount;
  }
  return resources;
}

export function sanitizeResourceAmounts(value: unknown): ResourceAmounts {
  const amounts: ResourceAmounts = {};
  if (!isRecord(value)) return amounts;
  for (const type of RESOURCE_TYPES) {
    const amount = value[type];
    if (isNonNegativeNumber(amount)) amounts[type] = Math.floor(amount);
  }
  return amounts;
}
