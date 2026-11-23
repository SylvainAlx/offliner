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
import { HOUR, MINUTE } from "../helpers/time";
import { setBalance } from "../helpers/user";

const T0 = 1_800_000_000_000;

function newUser(): User {
  return new User("Joueur", T0);
}

describe("buildings", () => {
  it("follows the cost curves of the design document", () => {
    expect(getBuildingCost("metalMine", 1)).toEqual({ metal: 90, offlinium: 15 });
    expect(getBuildingCost("metalMine", 3)).toEqual({ metal: 202, offlinium: 33 });
    expect(getBuildingCost("laboratory", 2)).toEqual({ metal: 600, offlinium: 800 });
  });

  it("takes real time in proportion to the cost", () => {
    // (90 + 15) / 1000 h = 6.3 min
    expect(getConstructionMs("metalMine", 1)).toBe(378_000);
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
    const economy = computeEconomy(levels, 12);
    expect(economy.energyFactor).toBe(1);
    expect(economy.staffRequired).toBe(24);
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
    advanceRealTime(user.homeColony, T0, T0 + 10 * HOUR);
    expect(user.homeColony.resources.food).toBeCloseTo(STARTING_RESOURCES.food);
    expect(user.homeColony.population).toBe(STARTING_POPULATION);
    expect(user.homeColony.resources.metal).toBeCloseTo(STARTING_RESOURCES.metal + 10 * BASE_METAL_PER_HOUR);
  });

  it("lets the population starve once the food runs out", () => {
    const user = newUser();
    user.homeColony.planet.levels.habitat = 5;
    user.homeColony.population = 100;
    user.homeColony.resources.food = 0;
    advanceRealTime(user.homeColony, T0, T0 + HOUR);
    expect(user.homeColony.resources.food).toBe(0);
    expect(user.homeColony.population).toBeLessThan(100);
    expect(user.homeColony.population).toBeGreaterThan(97);
  });

  it("grows the population towards the habitat's maximum", () => {
    const user = newUser();
    user.homeColony.planet.levels.habitat = 2;
    user.homeColony.planet.levels.reactor = 1;
    user.homeColony.resources.food = 10_000;
    advanceRealTime(user.homeColony, T0, T0 + 100 * HOUR);
    expect(user.homeColony.population).toBe(getPopulationMax(2));
  });
});

describe("user", () => {
  it("starts with the planned resources and population", () => {
    const user = newUser();
    expect(user.getResources()).toEqual(STARTING_RESOURCES);
    expect(user.homeColony.population).toBe(STARTING_POPULATION);
  });

  it("builds in real time, and the level counts from its exact end", () => {
    const user = newUser();
    expect(user.startConstruction("metalMine", T0)).toBe(true);
    const endsAt = T0 + getConstructionMs("metalMine", 1);

    expect(user.advance(endsAt - 1, 0)).toEqual([]);
    expect(user.homeColony.planet.levels.metalMine).toBe(0);

    expect(user.advance(endsAt + HOUR, 0)).toEqual([
      { type: "metalMine", level: 1, at: endsAt, colonyId: user.homeColonyId },
    ]);
    expect(user.homeColony.planet.levels.metalMine).toBe(1);
    expect(user.homeColony.planet.construction).toBeNull();
  });

  it("refuses a second construction, a full planet or missing resources", () => {
    const user = newUser();
    user.startConstruction("farm", T0);
    expect(user.getConstructionBlocker("metalMine")).toBe("busy");

    const full = newUser();
    full.homeColony.planet.levels.metalMine = PLANET_FIELDS;
    expect(full.getConstructionBlocker("farm")).toBe("noField");

    const poor = newUser();
    poor.offlinium = 0;
    expect(poor.getConstructionBlocker("farm")).toBe("resources");
    expect(poor.startConstruction("farm", T0)).toBe(false);
  });

  it("refunds everything when a construction is cancelled", () => {
    const user = newUser();
    user.startConstruction("laboratory", T0);
    expect(user.startConstruction("laboratory", T0)).toBe(false);

    const rich = newUser();
    setBalance(rich, { metal: 1000, food: 0, offlinium: 1000 });
    rich.startConstruction("laboratory", T0);
    expect(rich.cancelConstruction()).toBe(true);
    expect(rich.getResources()).toEqual({ metal: 1000, food: 0, offlinium: 1000 });
    expect(rich.homeColony.planet.usedFields).toBe(0);
  });

  it("buys construction time with Offlinium: 1 per 10 s", () => {
    const user = newUser();
    user.homeColony.resources.metal = 10_000;
    user.startConstruction("reactor", T0);
    const before = user.homeColony.planet.construction!.endsAt;
    const offlinium = user.offlinium;

    expect(user.speedUpConstruction(60_000, T0)).toBe(true);
    expect(user.homeColony.planet.construction!.endsAt).toBe(before - 60_000);
    expect(user.offlinium).toBe(offlinium - 6);

    // Finishing it completes it at the next update.
    expect(user.speedUpConstruction(Number.MAX_SAFE_INTEGER, T0)).toBe(true);
    expect(user.advance(T0, 0)).toHaveLength(1);
    expect(user.homeColony.planet.levels.reactor).toBe(1);
  });

  it("earns Offlinium from offline time only, boosted by the laboratory", () => {
    const user = newUser();
    user.advance(T0 + HOUR, 0);
    expect(user.offlinium).toBe(STARTING_RESOURCES.offlinium);

    user.advance(T0 + HOUR, HOUR);
    expect(user.offlinium).toBe(STARTING_RESOURCES.offlinium + HOUR / INTERVAL);

    user.homeColony.planet.levels.laboratory = 2;
    user.homeColony.planet.levels.reactor = 10;
    user.homeColony.population = 100;
    user.advance(T0 + HOUR, 2 * HOUR);
    expect(user.offlinium).toBeCloseTo(
      STARTING_RESOURCES.offlinium + HOUR / INTERVAL + (HOUR / INTERVAL) * 1.5,
    );
  });

  it("ignores a clock that went back", () => {
    const user = newUser();
    user.advance(T0 + HOUR, 0);
    const metal = user.homeColony.resources.metal;
    expect(user.advance(T0, 0)).toEqual([]);
    expect(user.homeColony.resources.metal).toBe(metal);
    expect(user.realTimeSettledAt).toBe(T0 + HOUR);
  });

  it("survives a save and a clone", () => {
    const user = newUser();
    user.startConstruction("farm", T0);
    user.homeColony.planet.levels.habitat = 3;
    user.homeColony.population = 42.5;

    const restored = new User();
    restored.loadFromSnapshot(JSON.parse(JSON.stringify(user)));
    expect(restored.homeColony.planet.name).toBe(user.homeColony.planet.name);
    expect(restored.homeColony.planet.levels).toEqual(user.homeColony.planet.levels);
    expect(restored.homeColony.planet.construction).toEqual(user.homeColony.planet.construction);
    expect(restored.getResources()).toEqual(user.getResources());
    expect(restored.homeColony.population).toBe(42.5);
    expect(restored.realTimeSettledAt).toBe(T0);

    const copy = user.clone();
    copy.homeColony.planet.levels.habitat = 9;
    copy.homeColony.planet.construction!.cost.metal = 0;
    expect(user.homeColony.planet.levels.habitat).toBe(3);
    expect(user.homeColony.planet.construction!.cost.metal).toBe(getBuildingCost("farm", 1).metal);
  });

  it("ignores unknown or malformed data", () => {
    const user = new User();
    user.loadFromSnapshot({
      saveVersion: 2,
      offlinium: -4,
      colonies: [
        {
          id: "home",
          planet: { levels: { metalMine: -2, unknown: 5, farm: 2.7 }, construction: { type: "x" } },
          resources: { metal: "a", food: 3 },
          population: -1,
        },
        { planet: {} },
      ],
      __proto__: { admin: true },
    });
    expect(user.colonies).toHaveLength(1);
    expect(user.homeColony.planet.levels.metalMine).toBe(0);
    expect(user.homeColony.planet.levels.farm).toBe(2);
    expect(user.homeColony.planet.construction).toBeNull();
    expect(user.getResources()).toEqual({ metal: 0, food: 3, offlinium: STARTING_RESOURCES.offlinium });
    expect(user.homeColony.population).toBe(0);
  });

  it("starts afresh from a save of another version or without a planet", () => {
    for (const snapshot of [
      { name: "Alex", planet: { name: "Velora IV" }, resources: { metal: 5 } },
      { name: "Alex", saveVersion: 2, colonies: [] },
      { name: "Alex", saveVersion: 3, colonies: [{ id: "a" }] },
    ]) {
      const user = new User("Joueur", T0);
      const before = JSON.stringify(user.homeColony.planet);
      user.loadFromSnapshot(snapshot);
      expect(user.name).toBe("Joueur");
      expect(JSON.stringify(user.homeColony.planet)).toBe(before);
    }
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

  it("keeps its seed through a save and a clone", () => {
    const user = new User();
    const restored = new User();
    restored.loadFromSnapshot(JSON.parse(JSON.stringify(user)));
    expect(restored.homeColony.planet.seed).toBe(user.homeColony.planet.seed);
    expect(user.clone().homeColony.planet.seed).toBe(user.homeColony.planet.seed);
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

describe("depot and population trend", () => {
  it("caps metal and food at the depot's capacity, never Offlinium", async () => {
    const { getStorageCapacity } = await import("../../src/models/buildings");
    expect(getStorageCapacity(0)).toBe(1000);
    expect(getStorageCapacity(1)).toBe(1800);

    const user = newUser();
    setBalance(user, { metal: 990, food: 990, offlinium: 5000 });
    user.homeColony.planet.levels.farm = 5;
    user.homeColony.planet.levels.reactor = 5;
    user.homeColony.population = 10;
    advanceRealTime(user.homeColony, T0, T0 + 10 * HOUR);
    expect(user.homeColony.resources.metal).toBe(1000);
    expect(user.homeColony.resources.food).toBe(1000);

    // A refund above the capacity is kept, but does not grow.
    user.homeColony.resources.metal = 1500;
    advanceRealTime(user.homeColony, T0 + 10 * HOUR, T0 + 11 * HOUR);
    expect(user.homeColony.resources.metal).toBe(1500);
    user.advance(T0 + 11 * HOUR, 100 * HOUR);
    expect(user.offlinium).toBeGreaterThan(5000 + 1000);
  });

  it("tells where the population is heading", async () => {
    const { getPopulationTrend } = await import("../../src/models/economy");
    const levels = { ...emptyLevels(), habitat: 2, reactor: 3 };
    const growing = getPopulationTrend(computeEconomy(levels, 20), 20, 500);
    expect(growing.status).toBe("growing");
    expect(growing.perHour).toBe(2.5); // 5 % of 50
    expect(growing.timeToFullMs).toBe(12 * HOUR);

    expect(getPopulationTrend(computeEconomy(levels, 50), 50, 500).status).toBe("full");

    const hungry = getPopulationTrend(computeEconomy(levels, 50), 50, 0);
    expect(hungry.status).toBe("starving");
    expect(hungry.perHour).toBe(-1);

  });

  it("forecasts when the food runs out, at the pace of the clock", async () => {
    const { predictFoodRunOutMs } = await import("../../src/models/economy");
    const user = newUser();
    const colony = user.homeColony;
    colony.planet.levels = { ...emptyLevels(), habitat: 2, reactor: 3 };
    // Full planet (50 inhabitants, max 50): eats 50, produces 10, no growth.
    colony.population = 50;
    colony.resources.food = 80;
    expect(predictFoodRunOutMs(colony, T0)).toBeCloseTo(2 * HOUR, -3);

    // A growing planet eats more every minute: sooner than today's deficit says.
    colony.population = 30;
    colony.resources.food = 100;
    const linear = (100 / (30 - 10)) * HOUR;
    const forecast = predictFoodRunOutMs(colony, T0)!;
    expect(forecast).toBeLessThan(linear);

    // Half an hour later, the forecast is half an hour shorter, not more.
    user.realTimeSettledAt = T0;
    user.advance(T0 + HOUR / 2, 0);
    const later = predictFoodRunOutMs(colony, T0 + HOUR / 2)!;
    expect(Math.abs(forecast - later - HOUR / 2)).toBeLessThan(2 * MINUTE);

    // No deficit, no forecast.
    colony.resources.food = 500;
    colony.population = 5;
    expect(predictFoodRunOutMs(colony, T0)).toBeNull();
  });
});

describe("planetary leader", () => {
  it("is there from the first day, and the player can rename them", () => {
    const user = newUser();
    expect(user.notables).toHaveLength(1);
    const leader = user.leader!;
    expect(leader.role).toBe("leader");
    expect(leader.title).toBe("Chef planétaire");
    expect(leader.description).toContain(user.homeColony.planet.name);

    expect(user.updateNotable(leader.id, { name: "Ada Prax", title: "Gouverneure", description: "  Fondatrice.  " })).toBe(true);
    expect(user.leader).toMatchObject({ name: "Ada Prax", title: "Gouverneure", description: "Fondatrice." });
    expect(user.updateNotable(leader.id, { name: "  ", title: "X", description: "" })).toBe(false);
    expect(user.updateNotable("missing", { name: "A", title: "B", description: "" })).toBe(false);
  });

  it("speaks proper French about the planet", async () => {
    const { createLeader } = await import("../../src/models/notable");
    expect(createLeader("Arays III", 0, "home").description).toContain("colonie d'Arays III");
    expect(createLeader("Velora IV", 0, "home").description).toContain("colonie de Velora IV");
  });

  it("survives a save and a clone", () => {
    const user = newUser();
    user.updateNotable(user.leader!.id, { name: "Ada Prax", title: "Gouverneure", description: "" });

    const restored = new User();
    restored.loadFromSnapshot(JSON.parse(JSON.stringify(user)));
    expect(restored.notables).toEqual(user.notables);

    const copy = user.clone();
    copy.leader!.name = "Autre";
    expect(user.leader!.name).toBe("Ada Prax");
  });
});

describe("weekly notables", () => {
  const WEEK = 7 * 24 * HOUR;

  it("welcomes one inhabitant per week of the planet's life", () => {
    const user = newUser();
    const start = user.createdAt;
    expect(user.leader!.isCustomized).toBe(false);
    expect(user.notablesToCustomize).toBe(1);

    user.advance(start + WEEK - 1, 0);
    expect(user.weeklyNotables).toHaveLength(0);
    expect(user.getNextNotableAt(start + WEEK - 1)).toBe(start + WEEK);

    user.advance(start + WEEK, 0);
    expect(user.weeklyNotables).toHaveLength(1);
    const first = user.weeklyNotables[0];
    expect(first).toMatchObject({ role: "notable", featuredAt: start + WEEK, description: "", isCustomized: false });
    expect(first.title.length).toBeGreaterThan(0);
    expect(user.getNextNotableAt(start + WEEK)).toBe(start + 2 * WEEK);

    // Three weeks away: the two missed inhabitants are waiting, newest first.
    user.advance(start + 3 * WEEK + HOUR, 0);
    expect(user.weeklyNotables.map((notable) => notable.featuredAt)).toEqual([
      start + 3 * WEEK,
      start + 2 * WEEK,
      start + WEEK,
    ]);
    expect(user.notablesToCustomize).toBe(4);
  });

  it("gives the same inhabitants to the same planet, and lets the player tell their story", async () => {
    const { createWeeklyNotable, getNotableWeek } = await import("../../src/models/notable");
    expect(createWeeklyNotable("velora", 0, 2, "home")).toEqual(createWeeklyNotable("velora", 0, 2, "home"));
    expect(createWeeklyNotable("velora", 0, 2, "home").id).not.toBe(createWeeklyNotable("velora", 0, 3, "home").id);
    expect(getNotableWeek(createWeeklyNotable("velora", 1000, 5, "home"), 1000)).toBe(5);
    for (let week = 1; week < 12; week++) {
      expect(createWeeklyNotable("velora", 0, week, "home").title).not.toBe(createWeeklyNotable("velora", 0, week + 1, "home").title);
    }

    const user = newUser();
    user.advance(user.createdAt + WEEK, 0);
    const id = user.weeklyNotables[0].id;
    expect(user.updateNotable(id, { name: "Lia Ferral", title: "Ingénieure", description: "A réparé le réacteur." })).toBe(true);
    expect(user.weeklyNotables[0]).toMatchObject({ name: "Lia Ferral", isCustomized: true });

    // A tick that sees the same week again never duplicates or resets them.
    user.advance(user.createdAt + WEEK + HOUR, 0);
    expect(user.weeklyNotables).toHaveLength(1);
    expect(user.weeklyNotables[0].name).toBe("Lia Ferral");

    const restored = new User();
    restored.loadFromSnapshot(JSON.parse(JSON.stringify(user)));
    expect(restored.notables).toEqual(user.notables);
  });
});

describe("star system", () => {
  it("always gives the same system for a planet, with 3 to 6 planets around a star", async () => {
    const { generateStarSystem, isKindPlausible, orbitTemperature, MIN_PLANETS, MAX_PLANETS } =
      await import("../../src/models/starSystem");
    const home = { seed: "velora", name: "Velora IV", fields: 163 };
    const system = generateStarSystem(home);
    expect(generateStarSystem(home)).toEqual(system);

    const counts = new Set<number>();
    for (let index = 0; index < 80; index += 1) {
      const other = generateStarSystem({ seed: `seed-${index}`, name: "X", fields: 163 });
      counts.add(other.planets.length);
      expect(other.planets.filter((planet) => planet.isHome)).toHaveLength(1);
      other.planets.forEach((planet, orbit) => {
        expect(planet.orbit).toBe(orbit);
        expect(planet.isColonizable).toBe(planet.kind !== "gas");
        // Every planet, the player's included, fits its distance to the star.
        expect(isKindPlausible(planet.kind, orbitTemperature(other.star.type, orbit))).toBe(true);
      });
    }
    expect(Math.min(...counts)).toBe(MIN_PLANETS);
    expect(Math.max(...counts)).toBe(MAX_PLANETS);
  });

  it("keeps volcanic worlds close to the star and icy ones far from it", async () => {
    const { isKindPlausible, orbitTemperature } = await import("../../src/models/starSystem");
    expect(isKindPlausible("lava", orbitTemperature("yellow", 0))).toBe(true);
    expect(isKindPlausible("ice", orbitTemperature("yellow", 0))).toBe(false);
    expect(isKindPlausible("lava", orbitTemperature("yellow", 5))).toBe(false);
    expect(isKindPlausible("ice", orbitTemperature("yellow", 5))).toBe(true);
    expect(isKindPlausible("ocean", orbitTemperature("yellow", 2))).toBe(true);
  });

  it("puts the player's own planet in it, as it is", async () => {
    const { generateStarSystem } = await import("../../src/models/starSystem");
    const { generatePlanetSprite } = await import("../../src/utils/planetSprite");
    const system = generateStarSystem({ seed: "velora", name: "Velora IV", fields: 163 });
    const home = system.planets.find((planet) => planet.isHome)!;
    expect(home).toMatchObject({ name: "Velora IV", seed: "velora", fields: 163, distanceFromHomeAu: 0 });
    expect(home.kind).toBe(generatePlanetSprite("velora").kind);
    // Renaming the planet does not move it or change the system.
    const renamed = generateStarSystem({ seed: "velora", name: "Nouveau nom", fields: 163 });
    expect(renamed.star).toEqual(system.star);
    expect(renamed.planets.map((planet) => planet.kind)).toEqual(system.planets.map((planet) => planet.kind));
  });
});

describe("spaceport", () => {
  it("is a building like the others, needed to open the star system", () => {
    expect(getBuildingCost("spaceport", 1)).toEqual({ metal: 600, offlinium: 200 });
    const user = newUser();
    expect(user.homeColony.planet.levels.spaceport).toBe(0);
    setBalance(user, { metal: 1000, food: 0, offlinium: 1000 });
    expect(user.startConstruction("spaceport", T0)).toBe(true);
    user.advance(T0 + getConstructionMs("spaceport", 1), 0);
    expect(user.homeColony.planet.levels.spaceport).toBe(1);

    const restored = new User();
    restored.loadFromSnapshot(JSON.parse(JSON.stringify(user)));
    expect(restored.homeColony.planet.levels.spaceport).toBe(1);
  });
});

describe("surface view", () => {
  it("stands every building on the ground, inside the scene, without overlapping", async () => {
    const { getBuildingAnchor, surfaceY, SCENE_WIDTH, SCENE_HEIGHT, BUILDING_WIDTH, BUILDING_HEIGHT } =
      await import("../../src/utils/surfaceScene");
    const { BUILDING_TYPES } = await import("../../src/models/buildings");
    const anchors = BUILDING_TYPES.map((type) => ({ type, ...getBuildingAnchor(type) }));
    for (const anchor of anchors) {
      expect(anchor.x - BUILDING_WIDTH / 2).toBeGreaterThanOrEqual(0);
      expect(anchor.x + BUILDING_WIDTH / 2).toBeLessThanOrEqual(SCENE_WIDTH);
      expect(anchor.y).toBeGreaterThan(surfaceY(anchor.x)); // on the ground, below the horizon
      expect(anchor.y + 8).toBeLessThanOrEqual(SCENE_HEIGHT); // level label included
    }
    // Buildings of the same row never overlap.
    for (const first of anchors) {
      for (const second of anchors) {
        if (first === second || Math.abs(first.y - second.y) >= BUILDING_HEIGHT) continue;
        expect(Math.abs(first.x - second.x)).toBeGreaterThanOrEqual(BUILDING_WIDTH);
      }
    }
  });

  it("draws the ground in the colors of the planet, and buildings without their own ground", async () => {
    const { generateSurfaceGround } = await import("../../src/utils/surfaceScene");
    const { generateBuildingSprite, PLANET_GROUNDS } = await import("../../src/utils/buildingSprite");
    const ground = generateSurfaceGround("ice", "seed");
    expect(ground.some((run) => run.color === PLANET_GROUNDS.ice.top)).toBe(true);
    expect(generateSurfaceGround("ice", "seed")).toEqual(ground);

    const plain = generateBuildingSprite("farm", 1, "ice", { withGround: false });
    expect(plain.height).toBe(17);
    expect(plain.runs.every((run) => run.y < 17)).toBe(true);
    expect(plain.runs.some((run) => run.color === PLANET_GROUNDS.ice.body)).toBe(false);
  });
});

describe("colonies", () => {
  async function foundSecondColony(user: User) {
    const { Colony } = await import("../../src/models/colony");
    const planet = new Planet("Talion II", "talion");
    planet.kind = "ice";
    const colony = new Colony({
      foundedAt: T0,
      systemPlanetId: "orbit-3",
      planet,
      resources: { metal: 2000, food: 100 },
      population: 20,
    });
    user.addColony(colony);
    return colony;
  }

  it("runs every colony on the same real-time clock, each with its own stocks and site", async () => {
    const user = newUser();
    const home = user.homeColony;
    const colony = await foundSecondColony(user);

    expect(user.startConstruction("metalMine", T0)).toBe(true);
    expect(user.startConstruction("farm", T0, colony.id)).toBe(true);
    // Each planet pays its metal; the Offlinium is the player's.
    expect(home.resources.metal).toBe(STARTING_RESOURCES.metal - getBuildingCost("metalMine", 1).metal!);
    expect(colony.resources.metal).toBe(2000 - getBuildingCost("farm", 1).metal!);
    expect(user.offlinium).toBe(
      STARTING_RESOURCES.offlinium - getBuildingCost("metalMine", 1).offlinium! - getBuildingCost("farm", 1).offlinium!,
    );

    const done = user.advance(T0 + 10 * HOUR, 0);
    expect(done.map((item) => [item.type, item.colonyId]).sort()).toEqual([
      ["farm", colony.id],
      ["metalMine", home.id],
    ]);
    expect(home.planet.levels).toMatchObject({ metalMine: 1, farm: 0 });
    expect(colony.planet.levels).toMatchObject({ metalMine: 0, farm: 1 });
    expect(colony.population).toBeGreaterThan(19);

    // Cancelling refunds the planet that paid.
    user.startConstruction("reactor", T0 + 10 * HOUR, colony.id);
    const before = home.resources.metal;
    expect(user.cancelConstruction(colony.id)).toBe(true);
    expect(home.resources.metal).toBe(before);
    expect(colony.planet.construction).toBeNull();
  });

  it("adds up the laboratories of every planet", async () => {
    const user = newUser();
    const colony = await foundSecondColony(user);
    for (const target of [user.homeColony, colony]) {
      target.planet.levels.laboratory = 2;
      target.planet.levels.reactor = 10;
      target.population = 100;
    }
    expect(user.offliniumMultiplier).toBeCloseTo(1 + 2 * 2 * 0.25);
  });

  it("switches the planet shown, gives each colony a leader and keeps a colony's kind", async () => {
    const user = newUser();
    const colony = await foundSecondColony(user);
    expect(user.getLeader(colony.id)).toMatchObject({ colonyId: colony.id, featuredAt: T0 });
    user.addColony(colony);
    expect(user.colonies).toHaveLength(2);
    expect(user.setActiveColony("missing")).toBe(false);
    expect(user.setActiveColony(colony.id)).toBe(true);
    expect(user.activeColony).toBe(colony);
    expect(user.getResources()).toEqual({ metal: 2000, food: 100, offlinium: STARTING_RESOURCES.offlinium });
    expect(user.renamePlanet("Nouvelle Talion")).toBe(true);
    expect(user.homeColony.planet.name).not.toBe("Nouvelle Talion");

    const restored = new User();
    restored.loadFromSnapshot(JSON.parse(JSON.stringify(user)));
    expect(restored.activeColony.id).toBe(colony.id);
    expect(restored.activeColony.planet.kind).toBe("ice");
    expect(restored.getLeader(colony.id)).toMatchObject({ role: "leader", colonyId: colony.id });
    expect(restored.getLeader(colony.id)!.description).toContain("Talion II");
    expect(restored.leader).toBe(restored.getLeader(colony.id));
    expect(restored.getLeader(user.homeColonyId)!.id).toBe(user.getLeader(user.homeColonyId)!.id);

    const copy = restored.clone();
    copy.activeColony.resources.metal = 0;
    expect(restored.activeColony.resources.metal).toBe(2000);
  });

  it("counts achievements over all the planets", async () => {
    const { getAchievements } = await import("../../src/models/achievement");
    const user = newUser();
    const colony = await foundSecondColony(user);
    colony.planet.levels.spaceport = 1;
    const unlocked = getAchievements(user, 0).filter((item) => item.unlocked).map((item) => item.id);
    expect(unlocked).toContain("spaceport");
    expect(user.isSystemUnlocked).toBe(true);
    const population = getAchievements(user, 0).find((item) => item.id === "population-hundred")!;
    expect(population.progress).toBe(STARTING_POPULATION + 20);
  });
});

describe("expeditions", () => {
  async function userWithNeighbors() {
    const { generateStarSystem } = await import("../../src/models/starSystem");
    const { getDistanceAu } = await import("../../src/models/expedition");
    // A system with a colonizable planet within 0.5 AU and another one further.
    for (let index = 0; ; index++) {
      const seed = `expedition-${index}`;
      const system = generateStarSystem({ seed, name: "Base", fields: 163 });
      const home = system.planets.find((planet) => planet.isHome)!;
      const others = system.planets.filter((planet) => !planet.isHome && planet.isColonizable);
      const near = others.find((planet) => getDistanceAu(home, planet) <= 0.5);
      const far = others.find((planet) => getDistanceAu(home, planet) > 1);
      if (!near || !far) continue;
      const user = newUser();
      user.homeColony.planet.seed = seed;
      user.homeColony.planet.name = "Base";
      user.homeColony.population = 50;
      setBalance(user, { metal: 20_000, food: 5000, offlinium: 5000 });
      return { user, near, far };
    }
  }

  it("reaches 0.5 AU per spaceport level, flies 2 h per AU and burns Offlinium", async () => {
    const e = await import("../../src/models/expedition");
    expect(e.getSpaceportRange(3)).toBe(1.5);
    expect(e.getRequiredSpaceportLevel(0.3)).toBe(1);
    expect(e.getRequiredSpaceportLevel(0.5)).toBe(1);
    expect(e.getRequiredSpaceportLevel(1.1)).toBe(3);
    expect(e.getFlightMs(1.5)).toBe(3 * HOUR);
    expect(e.getFlightMs(0.1)).toBe(HOUR / 2);
    expect(e.getFuelCost("colonization", 1.5)).toBe(150);
    expect(e.getFuelCost("cargo", 1.5)).toBe(60);
    expect(e.getCargoCapacity(2)).toBe(4000);
  });

  it("founds a colony at the exact arrival time, with its colonists, stock and leader", async () => {
    const { user, near, far } = await userWithNeighbors();
    const home = user.homeColony;
    expect(user.planExpedition("colonization", home.id, near.id)!.blocker).toBe("noSpaceport");
    home.planet.levels.spaceport = 1;
    const tooFar = user.planExpedition("colonization", home.id, far.id)!;
    expect(tooFar.blocker).toBe("outOfRange");
    expect(tooFar.requiredLevel).toBeGreaterThan(1);
    expect(user.planExpedition("colonization", home.id, "home")!.blocker).toBe("samePlanet");

    const plan = user.planExpedition("colonization", home.id, near.id)!;
    expect(plan.blocker).toBeNull();
    expect(plan.cost).toEqual({ metal: 2000, food: 300, offlinium: plan.fuel });
    expect(user.launchExpedition("colonization", home.id, near.id, T0)).toBe(true);
    expect(home.resources).toEqual({ metal: 18_000, food: 4700 });
    expect(user.offlinium).toBe(5000 - plan.fuel);
    expect(home.population).toBe(40);
    expect(user.colonyCount).toBe(1);
    expect(user.planExpedition("colonization", home.id, near.id)!.blocker).toBe("occupied");

    const arriveAt = T0 + plan.flightMs;
    user.realTimeSettledAt = T0;
    user.advance(arriveAt - 1, 0);
    expect(user.colonies).toHaveLength(1);
    user.advance(arriveAt + HOUR, 0);
    expect(user.expeditions).toHaveLength(0);
    const colony = user.getColonyAt(near.id)!;
    expect(colony.foundedAt).toBe(arriveAt);
    expect(colony.planet).toMatchObject({ name: near.name, seed: near.seed, kind: near.kind, fields: near.fields });
    // An hour of base production since the landing, nothing before it.
    expect(colony.resources.metal).toBeCloseTo(500 + BASE_METAL_PER_HOUR);
    expect(user.getLeader(colony.id)).toMatchObject({ role: "leader", featuredAt: arriveAt });
    expect(user.expeditionReports[0]).toMatchObject({ kind: "colonization", outcome: "founded", targetName: near.name });
    expect(user.activeColony).toBe(home);
  });

  it("stops at 3 colonies and keeps one inhabitant at home", async () => {
    const { user, near } = await userWithNeighbors();
    const home = user.homeColony;
    home.planet.levels.spaceport = 1;
    home.population = 10;
    expect(user.planExpedition("colonization", home.id, near.id)!.blocker).toBe("colonists");

    home.population = 50;
    const { Colony } = await import("../../src/models/colony");
    for (let index = 0; index < 3; index++) {
      user.addColony(new Colony({ foundedAt: T0, systemPlanetId: `elsewhere-${index}` }));
    }
    expect(user.colonyCount).toBe(3);
    expect(user.planExpedition("colonization", home.id, near.id)!.blocker).toBe("maxColonies");
  });

  it("carries up to 2000 per spaceport level to one of the player's planets", async () => {
    const { user, near, far } = await userWithNeighbors();
    const home = user.homeColony;
    home.planet.levels.spaceport = 1;
    expect(user.planExpedition("cargo", home.id, near.id, { metal: 100, food: 0 })!.blocker).toBe("notOwned");

    user.launchExpedition("colonization", home.id, near.id, T0);
    user.realTimeSettledAt = T0;
    user.advance(T0 + 10 * HOUR, 0);
    const colony = user.getColonyAt(near.id)!;
    const now = T0 + 10 * HOUR;

    expect(user.planExpedition("cargo", home.id, near.id)!.blocker).toBe("emptyCargo");
    expect(user.planExpedition("cargo", home.id, near.id, { metal: 1500, food: 501 })!.blocker).toBe("capacity");
    const plan = user.planExpedition("cargo", home.id, near.id, { metal: 1500, food: 500 })!;
    expect(plan.blocker).toBeNull();
    expect(plan.capacity).toBe(2000);
    expect(plan.cost).toEqual({ metal: 1500, food: 500, offlinium: plan.fuel });

    const metalBefore = colony.resources.metal;
    const homeMetal = home.resources.metal;
    expect(user.launchExpedition("cargo", home.id, near.id, now, { metal: 1500, food: 500 })).toBe(true);
    expect(home.resources.metal).toBe(homeMetal - 1500);
    user.advance(now + plan.flightMs, 0);
    expect(colony.resources.metal).toBeGreaterThan(metalBefore + 1500);
    expect(user.expeditionReports[0]).toMatchObject({ kind: "cargo", outcome: "delivered" });

    // From the colony, which has no spaceport yet.
    expect(user.planExpedition("cargo", colony.id, "home", { metal: 1, food: 0 })!.blocker).toBe("noSpaceport");
    expect(user.planExpedition("cargo", home.id, far.id, { metal: 1, food: 0 })!.blocker).toBe("notOwned");
  });

  it("counts expeditions and cargo for the achievements, through a save", async () => {
    const { user, near } = await userWithNeighbors();
    const home = user.homeColony;
    home.planet.levels.spaceport = 1;
    user.launchExpedition("colonization", home.id, near.id, T0);
    user.realTimeSettledAt = T0;
    user.advance(T0 + 10 * HOUR, 0);
    user.launchExpedition("cargo", home.id, near.id, T0 + 10 * HOUR, { metal: 700, food: 300 });
    user.advance(T0 + 20 * HOUR, 0);
    expect(user.stats).toEqual({ expeditionsLaunched: 2, cargoDeliveries: 1, cargoUnitsDelivered: 1000 });

    const restored = new User();
    restored.loadFromSnapshot(JSON.parse(JSON.stringify(user)));
    expect(restored.stats).toEqual(user.stats);
    const copy = restored.clone();
    copy.stats.cargoDeliveries = 9;
    expect(restored.stats.cargoDeliveries).toBe(1);
  });

  it("keeps expeditions in flight through a save, and sends back what cannot land", async () => {
    const { user, near } = await userWithNeighbors();
    const home = user.homeColony;
    home.planet.levels.spaceport = 1;
    user.launchExpedition("colonization", home.id, near.id, T0);
    const restored = new User();
    restored.loadFromSnapshot(JSON.parse(JSON.stringify(user)));
    expect(restored.expeditions).toEqual(user.expeditions);
    expect(restored.colonyCount).toBe(1);

    // Someone got there first: the colonists and their stock come back.
    const { Colony } = await import("../../src/models/colony");
    restored.addColony(new Colony({ foundedAt: T0, systemPlanetId: near.id }));
    const population = restored.homeColony.population;
    restored.realTimeSettledAt = T0;
    restored.advance(restored.expeditions[0].arriveAt, 0);
    expect(restored.expeditionReports[0].outcome).toBe("returned");
    expect(restored.homeColony.population).toBeGreaterThanOrEqual(population + 10 - 0.01);

    const copy = restored.clone();
    copy.expeditionReports[0].cargo.metal = -1;
    expect(restored.expeditionReports[0].cargo.metal).toBe(500);
  });
});
