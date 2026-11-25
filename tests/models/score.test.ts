import { describe, expect, it } from "vitest";
import { User } from "../../src/models/user";
import { getBuildingCost } from "../../src/models/buildings";
import {
  COLONY_VALUE,
  getBuildingsValue,
  getResourceValue,
  getScore,
} from "../../src/models/score";
import { emptyLevels } from "../../src/models/buildings";
import { COLONIZATION_COST } from "../../src/utils/constants";

const T0 = 1_800_000_000_000;

describe("score", () => {
  it("counts Offlinium twice", () => {
    expect(getResourceValue({ metal: 1000, food: 500, offlinium: 1000 })).toBe(3500);
    expect(COLONY_VALUE).toBe(COLONIZATION_COST.metal + COLONIZATION_COST.food);
  });

  it("adds up every level built", () => {
    const levels = emptyLevels();
    levels.laboratory = 3;
    const expected = [1, 2, 3]
      .map((level) => getResourceValue(getBuildingCost("laboratory", level)))
      .reduce((sum, value) => sum + value, 0);
    expect(getBuildingsValue(levels)).toBe(expected);
  });

  it("is worked out from the game as it is: retroactive, and lowered by a demolition", () => {
    const user = new User("Joueur", T0);
    expect(user.score).toBe(0);

    user.homeColony.planet.levels.laboratory = 4;
    user.homeColony.planet.levels.spaceport = 4;
    const built = user.score;
    expect(built).toBe(
      Math.floor(getBuildingsValue(user.homeColony.planet.levels) / 1000),
    );
    expect(built).toBeGreaterThan(0);

    user.demolishBuilding("laboratory");
    expect(user.score).toBeLessThan(built);
    expect(getScore(user)).toBe(user.score);
  });

  it("travels with radar signals", () => {
    const user = new User("Joueur", T0);
    user.homeColony.planet.levels.radar = 1;
    user.homeColony.planet.levels.laboratory = 5;
    const sent = user.emitSignal(user.homeColonyId, user.leader.id, "Bonjour", T0);
    expect(sent?.score).toBe(user.score);
  });
});
