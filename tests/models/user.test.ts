import { describe, expect, it } from "vitest";
import { User } from "../../src/models/user";
import { Planet, generatePlanetName } from "../../src/models/planet";
import { advanceRealTime, computeEconomy } from "../../src/models/economy";
import {
  BUILDINGS,
  describeSettlement,
  emptyLevels,
  getBuildingCost,
  getConstructionMs,
  getPopulationMax,
} from "../../src/models/buildings";
import {
  BASE_FOOD_PER_HOUR,
  BASE_METAL_PER_HOUR,
  OFFLINIUM_DELIVERY_INTERVAL as INTERVAL,
  PLANET_FIELDS,
  STARTING_POPULATION,
  STARTING_RESOURCES,
} from "../../src/utils/constants";
import { HOUR } from "../helpers/time";

const T0 = 1_800_000_000_000;

function newUser(): User {
  return new User("Joueur", T0);
}

describe("buildings", () => {
  it("follows the cost curves of the design document", () => {
    expect(getBuildingCost("metalMine", 1)).toEqual({ metal: 60, offlinium: 15 });
    expect(getBuildingCost("metalMine", 3)).toEqual({ metal: 135, offlinium: 33 });
    expect(getBuildingCost("laboratory", 2)).toEqual({ metal: 400, offlinium: 800 });
  });

  it("takes real time in proportion to the cost", () => {
    // (60 + 15) / 2500 h = 1.8 min
    expect(getConstructionMs("metalMine", 1)).toBe(108_000);
  });

  it("turns the habitat into a village, a city, then a megalopolis", () => {
    expect(describeSettlement(0)).toBe("Campement");
    expect(describeSettlement(3)).toBe("Village niv. 3");
    expect(describeSettlement(6)).toBe("Ville niv. 1");
    expect(describeSettlement(11)).toBe("Mégalopole niv. 1");
    expect(getPopulationMax(0)).toBe(STARTING_POPULATION);
    expect(getPopulationMax(5)).toBe(110);
    expect(getPopulationMax(6)).toBeGreaterThan(getPopulationMax(5));
  });
});

describe("planet", () => {
  it("starts empty, with a generated name and 163 fields", () => {
    const planet = new Planet();
    expect(planet.fields).toBe(PLANET_FIELDS);
    expect(planet.usedFields).toBe(0);
    expect(generatePlanetName(() => 0)).toBe("Velora I");
  });

  it("counts one field per level, the one being built included", () => {
    const planet = new Planet("Test");
    planet.levels.metalMine = 3;
    planet.levels.farm = 2;
    planet.construction = {
      type: "farm", targetLevel: 3, startedAt: 0, endsAt: 1, cost: {},
    };
    expect(planet.usedFields).toBe(6);
  });
});

describe("economy", () => {
  it("runs the buildings slower when energy is short", () => {
    const levels = { ...emptyLevels(), metalMine: 5 };
    const economy = computeEconomy(levels, 100);
    // 5 levels of solar panels against the mine's consumption.
    expect(economy.energyProduced).toBe(10);
    expect(economy.energyFactor).toBeCloseTo(10 / BUILDINGS.metalMine.energyConsumed(5));
    expect(economy.metalPerHour).toBeCloseTo(
      BASE_METAL_PER_HOUR + BUILDINGS.metalMine.production(5).metal! * economy.energyFactor,
    );
  });

  it("runs the buildings slower when staff is short", () => {
    const levels = { ...emptyLevels(), farm: 3, reactor: 5 };
    const economy = computeEconomy(levels, 8);
    expect(economy.energyFactor).toBe(1);
    expect(economy.staffRequired).toBe(16);
    expect(economy.staffFactor).toBe(0.5);
    expect(economy.productionFactor).toBe(0.5);
  });

  it("keeps the base production whatever happens", () => {
    const economy = computeEconomy(emptyLevels(), 0);
    expect(economy.metalPerHour).toBe(BASE_METAL_PER_HOUR);
    expect(economy.foodPerHour).toBe(BASE_FOOD_PER_HOUR);
  });

  it("feeds the starting colons with the base food production", () => {
    const user = newUser();
    advanceRealTime(user, T0, T0 + 10 * HOUR);
    expect(user.resources.food).toBeCloseTo(STARTING_RESOURCES.food);
    expect(user.population).toBe(STARTING_POPULATION);
    expect(user.resources.metal).toBeCloseTo(STARTING_RESOURCES.metal + 10 * BASE_METAL_PER_HOUR);
  });

  it("lets the population starve once the food runs out", () => {
    const user = newUser();
    user.planet.levels.habitat = 5;
    user.population = 100;
    user.resources.food = 0;
    advanceRealTime(user, T0, T0 + HOUR);
    expect(user.resources.food).toBe(0);
    expect(user.population).toBeLessThan(100);
    expect(user.population).toBeGreaterThan(97);
  });

  it("grows the population towards the habitat's maximum", () => {
    const user = newUser();
    user.planet.levels.habitat = 2;
    user.planet.levels.reactor = 1;
    user.resources.food = 10_000;
    advanceRealTime(user, T0, T0 + 100 * HOUR);
    expect(user.population).toBe(getPopulationMax(2));
  });
});

describe("user", () => {
  it("starts with the planned resources and population", () => {
    const user = newUser();
    expect(user.resources).toEqual(STARTING_RESOURCES);
    expect(user.population).toBe(STARTING_POPULATION);
  });

  it("builds in real time, and the level counts from its exact end", () => {
    const user = newUser();
    expect(user.startConstruction("metalMine", T0)).toBe(true);
    const endsAt = T0 + getConstructionMs("metalMine", 1);

    expect(user.advance(endsAt - 1, 0)).toEqual([]);
    expect(user.planet.levels.metalMine).toBe(0);

    expect(user.advance(endsAt + HOUR, 0)).toEqual([
      { type: "metalMine", level: 1, at: endsAt },
    ]);
    expect(user.planet.levels.metalMine).toBe(1);
    expect(user.planet.construction).toBeNull();
  });

  it("refuses a second construction, a full planet or missing resources", () => {
    const user = newUser();
    user.startConstruction("farm", T0);
    expect(user.getConstructionBlocker("metalMine")).toBe("busy");

    const full = newUser();
    full.planet.levels.metalMine = PLANET_FIELDS;
    expect(full.getConstructionBlocker("farm")).toBe("noField");

    const poor = newUser();
    poor.resources.offlinium = 0;
    expect(poor.getConstructionBlocker("farm")).toBe("resources");
    expect(poor.startConstruction("farm", T0)).toBe(false);
  });

  it("refunds everything when a construction is cancelled", () => {
    const user = newUser();
    user.startConstruction("laboratory", T0);
    expect(user.startConstruction("laboratory", T0)).toBe(false);

    const rich = newUser();
    rich.resources = { metal: 1000, food: 0, offlinium: 1000 };
    rich.startConstruction("laboratory", T0);
    expect(rich.cancelConstruction()).toBe(true);
    expect(rich.resources).toEqual({ metal: 1000, food: 0, offlinium: 1000 });
    expect(rich.planet.usedFields).toBe(0);
  });

  it("buys construction time with Offlinium: 1 per 10 s", () => {
    const user = newUser();
    user.resources.metal = 10_000;
    user.startConstruction("reactor", T0);
    const before = user.planet.construction!.endsAt;
    const offlinium = user.resources.offlinium;

    expect(user.speedUpConstruction(60_000, T0)).toBe(true);
    expect(user.planet.construction!.endsAt).toBe(before - 60_000);
    expect(user.resources.offlinium).toBe(offlinium - 6);

    // Finishing it completes it at the next update.
    expect(user.speedUpConstruction(Number.MAX_SAFE_INTEGER, T0)).toBe(true);
    expect(user.advance(T0, 0)).toHaveLength(1);
    expect(user.planet.levels.reactor).toBe(1);
  });

  it("earns Offlinium from offline time only, boosted by the laboratory", () => {
    const user = newUser();
    user.advance(T0 + HOUR, 0);
    expect(user.resources.offlinium).toBe(STARTING_RESOURCES.offlinium);

    user.advance(T0 + HOUR, HOUR);
    expect(user.resources.offlinium).toBe(STARTING_RESOURCES.offlinium + HOUR / INTERVAL);

    user.planet.levels.laboratory = 2;
    user.planet.levels.reactor = 10;
    user.population = 100;
    user.advance(T0 + HOUR, 2 * HOUR);
    expect(user.resources.offlinium).toBeCloseTo(
      STARTING_RESOURCES.offlinium + HOUR / INTERVAL + (HOUR / INTERVAL) * 1.2,
    );
  });

  it("ignores a clock that went back", () => {
    const user = newUser();
    user.advance(T0 + HOUR, 0);
    const metal = user.resources.metal;
    expect(user.advance(T0, 0)).toEqual([]);
    expect(user.resources.metal).toBe(metal);
    expect(user.realTimeSettledAt).toBe(T0 + HOUR);
  });

  it("survives a save and a clone", () => {
    const user = newUser();
    user.startConstruction("farm", T0);
    user.planet.levels.habitat = 3;
    user.population = 42.5;

    const restored = new User();
    restored.loadFromSnapshot(JSON.parse(JSON.stringify(user)));
    expect(restored.planet.name).toBe(user.planet.name);
    expect(restored.planet.levels).toEqual(user.planet.levels);
    expect(restored.planet.construction).toEqual(user.planet.construction);
    expect(restored.resources).toEqual(user.resources);
    expect(restored.population).toBe(42.5);
    expect(restored.realTimeSettledAt).toBe(T0);

    const copy = user.clone();
    copy.planet.levels.habitat = 9;
    copy.planet.construction!.cost.metal = 0;
    expect(user.planet.levels.habitat).toBe(3);
    expect(user.planet.construction!.cost.metal).toBe(getBuildingCost("farm", 1).metal);
  });

  it("ignores unknown or malformed data", () => {
    const user = new User();
    user.loadFromSnapshot({
      planet: { levels: { metalMine: -2, unknown: 5, farm: 2.7 }, construction: { type: "x" } },
      resources: { metal: "a", food: 3 },
      population: -1,
      __proto__: { admin: true },
    });
    expect(user.planet.levels.metalMine).toBe(0);
    expect(user.planet.levels.farm).toBe(2);
    expect(user.planet.construction).toBeNull();
    expect(user.resources).toEqual({ metal: 0, food: 3, offlinium: 0 });
    expect(user.population).toBe(STARTING_POPULATION);
  });
});

describe("planet sprite", () => {
  it("always draws the same planet for a seed, inside its grid", async () => {
    const { generatePlanetSprite } = await import("../../src/utils/planetSprite");
    const first = generatePlanetSprite("velora");
    expect(generatePlanetSprite("velora")).toEqual(first);
    expect(first.runs.length).toBeGreaterThan(20);
    for (const run of first.runs) {
      expect(run.x).toBeGreaterThanOrEqual(0);
      expect(run.x + run.width).toBeLessThanOrEqual(first.size);
      expect(run.y).toBeLessThan(first.size);
    }
  });

  it("varies from one seed to another", async () => {
    const { generatePlanetSprite } = await import("../../src/utils/planetSprite");
    const looks = new Set(
      Array.from({ length: 12 }, (_, index) => JSON.stringify(generatePlanetSprite(`seed-${index}`).runs)),
    );
    expect(looks.size).toBe(12);
  });

  it("keeps its seed through a save, and old saves fall back on the name", () => {
    const user = new User();
    const restored = new User();
    restored.loadFromSnapshot(JSON.parse(JSON.stringify(user)));
    expect(restored.planet.seed).toBe(user.planet.seed);
    expect(user.clone().planet.seed).toBe(user.planet.seed);

    const legacy = new User();
    legacy.loadFromSnapshot({ planet: { name: "Velora IV" } });
    expect(legacy.planet.seed).toBe("Velora IV");
  });
});

describe("building sprites", () => {
  it("get richer with the level and stand on their planet's ground", async () => {
    const { generateBuildingSprite, getBuildingTier } = await import("../../src/utils/buildingSprite");
    expect([1, 4, 5, 9, 10].map((level) => getBuildingTier("metalMine", level))).toEqual([0, 0, 1, 1, 2]);
    expect([5, 6, 10, 11].map((level) => getBuildingTier("habitat", level))).toEqual([0, 1, 1, 2]);

    const levels = [1, 5, 10].map((level) =>
      JSON.stringify(generateBuildingSprite("reactor", level, "ocean").runs),
    );
    expect(new Set(levels).size).toBe(3);

    const groundColor = (kind: "ocean" | "ice") =>
      generateBuildingSprite("farm", 1, kind).runs.find((run) => run.y === 19)?.color;
    expect(groundColor("ocean")).not.toBe(groundColor("ice"));
  });
});
