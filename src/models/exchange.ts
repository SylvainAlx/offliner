import type { Colony } from "./colony";
import { OFFLINIUM_PER_HOUR } from "../utils/constants";

/** What Offlinium can be exchanged for. */
export type ExchangeResource = "metal" | "food";

/**
 * The exchange rate of a planet: one hour of Offlinium (what the player earns
 * in an hour offline, laboratory bonus included) is worth one hour of the
 * planet's production (energy and staff included) of the chosen resource.
 */
export interface ExchangeQuote {
  offliniumPerHour: number;
  resourcePerHour: number;
  /** Units of the resource for one Offlinium. */
  rate: number;
  /** Room left in the depot for the resource. */
  freeCapacity: number;
  /** Offlinium that can be exchanged now: the balance, then the depot room. */
  maxOfflinium: number;
}

export function getExchangeQuote(
  colony: Colony,
  resource: ExchangeResource,
  offlinium: number,
  offliniumMultiplier: number,
): ExchangeQuote {
  const economy = colony.economy;
  const offliniumPerHour = OFFLINIUM_PER_HOUR * offliniumMultiplier;
  const resourcePerHour = resource === "metal" ? economy.metalPerHour : economy.foodPerHour;
  const rate = offliniumPerHour > 0 ? resourcePerHour / offliniumPerHour : 0;
  const freeCapacity = Math.max(0, Math.floor(economy.storageCapacity - colony.resources[resource]));
  const maxByDepot = rate > 0 ? Math.floor(freeCapacity / rate) : 0;
  return {
    offliniumPerHour,
    resourcePerHour,
    rate,
    freeCapacity,
    maxOfflinium: Math.max(0, Math.min(Math.floor(offlinium), maxByDepot)),
  };
}

/** Whole units of the resource received for `offlinium`. */
export function getExchangeAmount(quote: ExchangeQuote, offlinium: number): number {
  return Math.floor(Math.max(0, offlinium) * quote.rate);
}
