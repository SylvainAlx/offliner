import { describe, expect, it } from "vitest";
import { User } from "../../src/models/user";
import { OFFLINIUM_PER_HOUR } from "../../src/utils/constants";

function newUser(): User {
  const user = new User("Joueur", 0);
  user.offlinium = 2000;
  user.homeColony.resources = { metal: 0, food: 0 };
  return user;
}

describe("Offlinium exchange", () => {
  it("trades one hour of Offlinium for one hour of the planet's production", () => {
    const user = newUser();
    const colony = user.homeColony;
    const quote = user.getExchangeQuote("metal");
    expect(quote.offliniumPerHour).toBe(OFFLINIUM_PER_HOUR);
    expect(quote.resourcePerHour).toBe(colony.economy.metalPerHour);

    const received = user.exchangeOfflinium("metal", OFFLINIUM_PER_HOUR);
    expect(received).toBe(Math.floor(colony.economy.metalPerHour));
    expect(colony.resources.metal).toBe(received);
    expect(user.offlinium).toBe(2000 - OFFLINIUM_PER_HOUR);

    const food = user.exchangeOfflinium("food", OFFLINIUM_PER_HOUR);
    expect(food).toBe(Math.floor(colony.economy.foodPerHour));
  });

  it("follows the laboratory: more Offlinium per hour, each one worth less", () => {
    const user = newUser();
    const colony = user.homeColony;
    const before = user.getExchangeQuote("metal").rate;
    colony.planet.levels = { ...colony.planet.levels, laboratory: 2, reactor: 10 };
    colony.population = 50;
    const after = user.getExchangeQuote("metal");
    expect(after.offliniumPerHour).toBeCloseTo(OFFLINIUM_PER_HOUR * 1.5);
    expect(after.rate).toBeLessThan(before);
  });

  it("stops at the balance and at the room left in the depot", () => {
    const user = newUser();
    const colony = user.homeColony;
    user.offlinium = 10.7;
    expect(user.getExchangeQuote("metal").maxOfflinium).toBe(10);
    expect(user.exchangeOfflinium("metal", 11)).toBe(0);

    user.offlinium = 1_000_000;
    colony.resources.metal = colony.economy.storageCapacity - 5;
    const quote = user.getExchangeQuote("metal");
    expect(quote.freeCapacity).toBe(5);
    expect(Math.floor(quote.maxOfflinium * quote.rate)).toBeLessThanOrEqual(5);
    expect(user.exchangeOfflinium("metal", quote.maxOfflinium + 1)).toBe(0);
    expect(user.exchangeOfflinium("metal", quote.maxOfflinium)).toBeLessThanOrEqual(5);
    expect(colony.resources.metal).toBeLessThanOrEqual(colony.economy.storageCapacity);
  });

  it("refuses amounts that are not whole, positive or worth anything", () => {
    const user = newUser();
    expect(user.exchangeOfflinium("metal", 0)).toBe(0);
    expect(user.exchangeOfflinium("metal", -5)).toBe(0);
    expect(user.exchangeOfflinium("metal", 2.5)).toBe(0);
    // One Offlinium is worth less than one unit of metal at the start.
    expect(user.getExchangeQuote("metal").rate).toBeLessThan(1);
    expect(user.exchangeOfflinium("metal", 1)).toBe(0);
    expect(user.offlinium).toBe(2000);
  });
});
