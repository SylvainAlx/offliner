import { isNonNegativeNumber, isRecord } from "../utils/sanitize";

export const RESOURCE_TYPES = ["offlinium", "materials"] as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number];

/** A full balance: every resource has a value. */
export type Resources = Record<ResourceType, number>;

/** A cost, a production or a refund: missing resources count as 0. */
export type ResourceAmounts = Partial<Record<ResourceType, number>>;

export const RESOURCE_LABELS: Record<ResourceType, string> = {
  offlinium: "Offlinium",
  materials: "Matériaux",
};

export const RESOURCE_ICONS: Record<ResourceType, string> = {
  offlinium: "⬡",
  materials: "🪨",
};

export function emptyResources(): Resources {
  return { offlinium: 0, materials: 0 };
}

export function addResources(target: Resources, amounts: ResourceAmounts): void {
  for (const type of RESOURCE_TYPES) target[type] += amounts[type] ?? 0;
}

export function subtractResources(target: Resources, amounts: ResourceAmounts): void {
  for (const type of RESOURCE_TYPES) target[type] -= amounts[type] ?? 0;
}

export function hasResources(available: Resources, cost: ResourceAmounts): boolean {
  return RESOURCE_TYPES.every((type) => available[type] >= (cost[type] ?? 0));
}

/** What is still missing to pay `cost`, or an empty object when affordable. */
export function missingResources(
  available: Resources,
  cost: ResourceAmounts,
): ResourceAmounts {
  const missing: ResourceAmounts = {};
  for (const type of RESOURCE_TYPES) {
    const lacking = (cost[type] ?? 0) - available[type];
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

export function formatResources(amounts: ResourceAmounts): string {
  const parts = nonZeroResources(amounts).map(
    ([type, value]) => `${value} ${RESOURCE_ICONS[type]}`,
  );
  return parts.length > 0 ? parts.join(" · ") : `0 ${RESOURCE_ICONS.offlinium}`;
}

/** Copies only known, non-negative resources, as integers. */
export function sanitizeResourceAmounts(value: unknown): ResourceAmounts {
  const amounts: ResourceAmounts = {};
  if (!isRecord(value)) return amounts;
  for (const type of RESOURCE_TYPES) {
    const amount = value[type];
    if (isNonNegativeNumber(amount)) amounts[type] = Math.floor(amount);
  }
  return amounts;
}

export function sanitizeResources(value: unknown): Resources {
  return { ...emptyResources(), ...sanitizeResourceAmounts(value) };
}
