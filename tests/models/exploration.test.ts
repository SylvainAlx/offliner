import { describe, expect, it } from "vitest";
import {
  EXPLORATION_CHANCES,
  EXPLORATION_DISCOVERIES,
  drawExploration,
  type ExplorationDiscovery,
} from "../../src/models/exploration";
import { getAchievements } from "../../src/models/achievement";
import { getCargoCapacity, UNKNOWN_TARGET_ID } from "../../src/models/expedition";
import { User } from "../../src/models/user";
import {
  EXPLORATION_DURATION_MS,
  EXPLORATION_FUEL,
  MAX_RESCUED_INHABITANTS,
} from "../../src/utils/constants";
import { HOUR, MINUTE } from "../helpers/time";

const T0 = 1_800_000_000_000;
const CAPACITY = getCargoCapacity(2);

function newExplorer(): User {
  const user = new User("Joueur", T0);
  user.homeColony.planet.seed = "test-seed";
  user.homeColony.planet.levels.spaceport = 2;
  user.offlinium = 10_000;
  return user;
}

/** The rank of the first exploration of the test game that finds `wanted`. */
function findNumber(wanted: ExplorationDiscovery, from = 1): number {
  for (let number = from; number < from + 1000; number += 1) {
    const result = drawExploration(`test-seed:exploration-${number}`, CAPACITY, true);
    if (result.discovery === wanted) return number;
  }
  throw new Error(`No ${wanted} found`);
}

/** Sends exploration number `number` and brings the game to its return. */
function explore(user: User, number: number, start: number): number {
  user.stats.explorationsLaunched = number - 1;
  expect(user.launchExploration(user.homeColonyId, start)).toBe(true);
  const back = start + EXPLORATION_DURATION_MS;
  user.advance(back, 0);
  return back;
}

describe("exploration draw", () => {
  it("has chances adding up to 100 %", () => {
    const total = Object.values(EXPLORATION_CHANCES).reduce((sum, chance) => sum + chance, 0);
    expect(total).toBe(100);
  });

  it("gives the same result for the same exploration", () => {
    expect(drawExploration("seed:exploration-4", CAPACITY, true)).toEqual(
      drawExploration("seed:exploration-4", CAPACITY, true),
    );
  });

  it("follows the chances over consecutive explorations, with gains in their bounds", () => {
    const draws = 20_000;
    const counts = Object.fromEntries(EXPLORATION_DISCOVERIES.map((item) => [item, 0]));
    for (let number = 1; number <= draws; number += 1) {
      const result = drawExploration(`seed:exploration-${number}`, 10_000, true);
      counts[result.discovery] += 1;
      if (result.discovery === "metal") {
        expect(result.metal).toBeGreaterThanOrEqual(1000);
        expect(result.metal).toBeLessThanOrEqual(3000);
        expect(result.offlinium).toBe(0);
      } else if (result.discovery === "offlinium") {
        expect(result.offlinium).toBeGreaterThanOrEqual(100);
        expect(result.offlinium).toBeLessThanOrEqual(250);
        expect(result.metal).toBe(0);
      } else if (result.discovery === "wreck") {
        expect(result.metal).toBeGreaterThanOrEqual(500);
        expect(result.metal).toBeLessThanOrEqual(1500);
        expect(result.offlinium).toBeGreaterThanOrEqual(20);
        expect(result.offlinium).toBeLessThanOrEqual(80);
      } else {
        expect(result).toMatchObject({ metal: 0, offlinium: 0 });
      }
    }
    for (const discovery of EXPLORATION_DISCOVERIES) {
      const percent = (counts[discovery] / draws) * 100;
      expect(Math.abs(percent - EXPLORATION_CHANCES[discovery])).toBeLessThan(2);
    }
  });

  it("brings back less Offlinium on average than the fuel burnt", () => {
    let total = 0;
    for (let number = 1; number <= 5000; number += 1) {
      total += drawExploration(`seed:exploration-${number}`, CAPACITY, true).offlinium;
    }
    expect(total / 5000).toBeLessThan(EXPLORATION_FUEL / 2);
  });

  it("replaces a survivor with a wreck when none can be welcomed", () => {
    const seed = `test-seed:exploration-${findNumber("survivor")}`;
    expect(drawExploration(seed, CAPACITY, false).discovery).toBe("wreck");
  });
});

describe("exploration", () => {
  it("needs a spaceport and the fuel", () => {
    const user = newExplorer();
    user.homeColony.planet.levels.spaceport = 0;
    expect(user.planExploration(user.homeColonyId)?.blocker).toBe("noSpaceport");
    user.homeColony.planet.levels.spaceport = 1;
    user.offlinium = EXPLORATION_FUEL - 1;
    expect(user.planExploration(user.homeColonyId)?.blocker).toBe("resources");
    expect(user.launchExploration(user.homeColonyId, T0)).toBe(false);
    expect(user.expeditions).toHaveLength(0);
  });

  it("burns the fuel and allows one exploration at a time", () => {
    const user = newExplorer();
    expect(user.launchExploration(user.homeColonyId, T0)).toBe(true);
    expect(user.offlinium).toBe(10_000 - EXPLORATION_FUEL);
    expect(user.planExploration(user.homeColonyId)?.blocker).toBe("busy");
    expect(user.launchExploration(user.homeColonyId, T0)).toBe(false);

    user.advance(T0 + EXPLORATION_DURATION_MS - MINUTE, 0);
    expect(user.explorationInFlight).toBeDefined();
    user.advance(T0 + EXPLORATION_DURATION_MS, 0);
    expect(user.explorationInFlight).toBeUndefined();
    expect(user.planExploration(user.homeColonyId)?.blocker).toBeNull();
  });

  it("does not count in the expedition achievements", () => {
    const user = newExplorer();
    user.launchExploration(user.homeColonyId, T0);
    const first = getAchievements(user, 0).find((item) => item.id === "first-expedition");
    expect(first?.unlocked).toBe(false);
  });

  it("reports an empty exploration", () => {
    const user = newExplorer();
    explore(user, findNumber("nothing"), T0);
    expect(user.expeditionReports[0]).toMatchObject({
      kind: "exploration",
      outcome: "explored",
      discovery: "nothing",
      cargo: { metal: 0, food: 0 },
      offlinium: 0,
    });
  });

  it("credits the Offlinium found", () => {
    const user = newExplorer();
    explore(user, findNumber("offlinium"), T0);
    const found = user.expeditionReports[0].offlinium ?? 0;
    expect(found).toBeGreaterThan(0);
    expect(user.offlinium).toBe(10_000 - EXPLORATION_FUEL + found);
  });

  it("gives the same result when the app was closed during the flight", () => {
    const number = findNumber("wreck");
    const open = newExplorer();
    explore(open, number, T0);

    const closed = newExplorer();
    closed.stats.explorationsLaunched = number - 1;
    closed.launchExploration(closed.homeColonyId, T0);
    closed.advance(T0 + 48 * HOUR, 0);

    const { discovery, offlinium, cargo, arriveAt } = open.expeditionReports[0];
    expect(closed.expeditionReports[0]).toMatchObject({ discovery, offlinium, cargo, arriveAt });
  });

  it("survives a save and a reload during the flight", () => {
    const number = findNumber("metal");
    const user = newExplorer();
    user.stats.explorationsLaunched = number - 1;
    user.launchExploration(user.homeColonyId, T0);

    const loaded = new User();
    loaded.loadFromSnapshot(JSON.parse(JSON.stringify(user)));
    expect(loaded.explorationInFlight).toMatchObject({
      targetId: UNKNOWN_TARGET_ID,
      exploration: { number, spaceportLevel: 2 },
    });
    expect(loaded.stats.explorationsLaunched).toBe(number);

    user.advance(T0 + EXPLORATION_DURATION_MS, 0);
    loaded.advance(T0 + EXPLORATION_DURATION_MS, 0);
    expect(loaded.expeditionReports[0]).toEqual(user.expeditionReports[0]);

    const reloaded = new User();
    reloaded.loadFromSnapshot(JSON.parse(JSON.stringify(loaded)));
    expect(reloaded.expeditionReports[0]).toEqual(loaded.expeditionReports[0]);
  });

  it("welcomes a survivor apart from the weekly inhabitants, and keeps them", () => {
    const user = newExplorer();
    const back = explore(user, findNumber("survivor"), T0);
    expect(user.rescuedNotables).toHaveLength(1);
    expect(user.weeklyNotables).toHaveLength(0);
    const [survivor] = user.rescuedNotables;
    expect(survivor).toMatchObject({ colonyId: user.homeColonyId, featuredAt: back });
    expect(user.expeditionReports[0].survivorName).toBe(survivor.name);
    // Their specialty helps at once.
    const specialists = Object.values(user.homeColony.specialists);
    expect(specialists.reduce((sum, count) => sum + count, 0)).toBe(1);

    const loaded = new User();
    loaded.loadFromSnapshot(JSON.parse(JSON.stringify(user)));
    expect(loaded.rescuedNotables).toEqual([survivor]);
  });

  it(`welcomes at most ${MAX_RESCUED_INHABITANTS} survivors`, () => {
    const user = newExplorer();
    let time = T0;
    let number = 0;
    for (let rank = 0; rank <= MAX_RESCUED_INHABITANTS; rank += 1) {
      number = findNumber("survivor", number + 1);
      time = explore(user, number, time);
    }
    expect(user.rescuedNotables).toHaveLength(MAX_RESCUED_INHABITANTS);
    expect(user.expeditionReports[0].discovery).toBe("wreck");
  });

  it("loads a save made before explorations", () => {
    const snapshot = JSON.parse(JSON.stringify(newExplorer()));
    delete snapshot.stats.explorationsLaunched;
    const loaded = new User();
    loaded.loadFromSnapshot(snapshot);
    expect(loaded.stats.explorationsLaunched).toBe(0);
    expect(loaded.homeColony.planet.levels.spaceport).toBe(2);
  });
});
