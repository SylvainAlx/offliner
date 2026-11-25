import { describe, expect, it } from "vitest";
import { User } from "../../src/models/user";
import { Colony } from "../../src/models/colony";
import { computeEconomy } from "../../src/models/economy";
import { createWeeklyNotable } from "../../src/models/notable";
import { emptyLevels, getConstructionMs } from "../../src/models/buildings";
import {
  SPECIALTY_TYPES,
  describeSpecialtyBonus,
  emptySpecialists,
  getSpecialty,
  type Specialty,
} from "../../src/models/specialty";
import { NOTABLE_INTERVAL_MS } from "../../src/utils/constants";

const T0 = 1_800_000_000_000;

/** A game a few weeks old, with its weekly inhabitants. */
function userWithNotables(weeks: number): User {
  const user = new User("Joueur", T0);
  user.welcomeNotables(T0 + weeks * NOTABLE_INTERVAL_MS);
  return user;
}

function specialists(entries: Partial<Record<Specialty, number>>) {
  return { ...emptySpecialists(), ...entries };
}

describe("specialties", () => {
  it("come from the inhabitant's seed: the same every time, none for leaders", () => {
    const notable = createWeeklyNotable("planet-seed", T0, 3, "home");
    expect(getSpecialty(notable)).toBe(getSpecialty({ ...notable }));
    expect(SPECIALTY_TYPES).toContain(getSpecialty(notable));
    const user = new User("Joueur", T0);
    expect(getSpecialty(user.leader!)).toBeNull();
  });

  it("are spread among all kinds over the weeks", () => {
    const user = userWithNotables(60);
    const kinds = new Set(user.weeklyNotables.map((notable) => getSpecialty(notable)));
    expect(kinds.size).toBe(SPECIALTY_TYPES.length);
  });

  it("add 5 % each to their planet's economy", () => {
    const levels = { ...emptyLevels(), metalMine: 5, farm: 5, reactor: 5, depot: 2 };
    const base = computeEconomy(levels, 100);
    const boosted = computeEconomy(
      levels,
      100,
      specialists({ geologist: 2, agronomist: 1, physicist: 1, logistician: 1, medic: 3 }),
    );
    expect(boosted.metalPerHour).toBeCloseTo(base.metalPerHour * 1.1);
    expect(boosted.foodPerHour).toBeCloseTo(base.foodPerHour * 1.05);
    expect(boosted.energyProduced).toBeCloseTo(base.energyProduced * 1.05);
    expect(boosted.storageCapacity).toBe(Math.floor(base.storageCapacity * 1.05));
    expect(boosted.growthFactor).toBeCloseTo(1.15);
    expect(describeSpecialtyBonus("geologist", 2)).toBe("+10 % de métal");
  });

  it("speed up constructions and flights, never to zero", () => {
    const colony = new Colony({ foundedAt: T0, specialists: specialists({ engineer: 100 }) });
    expect(colony.getConstructionMs("farm", 1)).toBe(Math.round(getConstructionMs("farm", 1) / 6));
    expect(colony.getConstructionMs("farm", 1)).toBeGreaterThan(0);
  });

  it("follow the inhabitant to the planet they are sent to", () => {
    const user = userWithNotables(8);
    const colony = new Colony({ foundedAt: T0, systemPlanetId: "orbit-1" });
    user.addColony(colony);
    const notable = user.weeklyNotables[0];
    const specialty = getSpecialty(notable)!;
    const before = user.homeColony.specialists[specialty];

    expect(user.assignNotable(notable.id, colony.id)).toBe(true);
    expect(notable.colonyId).toBe(colony.id);
    expect(colony.specialists[specialty]).toBe(1);
    expect(user.homeColony.specialists[specialty]).toBe(before - 1);

    // Leaders stay home; unknown planets are refused.
    expect(user.assignNotable(user.leader!.id, colony.id)).toBe(false);
    expect(user.assignNotable(notable.id, "nowhere")).toBe(false);
  });

  it("are worked out again when a save is loaded", () => {
    const user = userWithNotables(10);
    const copy = new User();
    copy.loadFromSnapshot(JSON.parse(JSON.stringify({ ...user, saveVersion: 2 })));
    expect(copy.homeColony.specialists).toEqual(user.homeColony.specialists);
  });

  it("researchers add Offlinium for the whole empire", () => {
    const user = new User("Joueur", T0);
    const base = user.offliniumMultiplier;
    user.homeColony.specialists = specialists({ researcher: 2 });
    expect(user.offliniumMultiplier).toBeCloseTo(base + 0.1);
  });
});
