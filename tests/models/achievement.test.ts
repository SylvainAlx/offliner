import { describe, expect, it } from "vitest";
import { ACHIEVEMENT_DEFINITIONS, getAchievements } from "../../src/models/achievement";
import { Colony } from "../../src/models/colony";
import { User } from "../../src/models/user";
import { HOUR, local } from "../helpers/time";
import { observeOffline } from "../helpers/periods";

function userOfflineOn(days: Array<[number, number, number]>): User {
  const user = new User();
  for (const [year, month, day] of days) {
    observeOffline(user.periodList, local(year, month, day, 10), local(year, month, day, 11));
    user.periodList.closeAnyOpenPeriod(local(year, month, day, 11));
  }
  return user;
}

function progressOf(user: User, id: string, totalOfflineMs = 0) {
  const achievement = getAchievements(user, totalOfflineMs).find((item) => item.id === id);
  if (!achievement) throw new Error(`Unknown achievement ${id}`);
  return achievement;
}

describe("achievements", () => {
  it("unlocks the first hour offline", () => {
    const user = new User();
    expect(progressOf(user, "offline-hour", HOUR - 1).unlocked).toBe(false);
    expect(progressOf(user, "offline-hour", HOUR)).toMatchObject({ unlocked: true, progress: HOUR });
  });

  it("caps the displayed progress at the target", () => {
    expect(progressOf(new User(), "offline-hour", 10 * HOUR).progress).toBe(HOUR);
  });

  it("counts distinct offline days", () => {
    const user = userOfflineOn([
      [2026, 1, 1],
      [2026, 1, 5],
      [2026, 1, 9],
    ]);
    expect(progressOf(user, "offline-days-three").unlocked).toBe(true);
  });

  it("measures the longest streak of consecutive days, across months", () => {
    const user = userOfflineOn([
      [2026, 1, 29],
      [2026, 1, 30],
      [2026, 1, 31],
      [2026, 2, 1],
      [2026, 2, 3],
    ]);
    expect(progressOf(user, "offline-streak-seven").progress).toBe(4);
  });

  it("keeps the ids of the first achievements, so unlocked ones stay unlocked", () => {
    const ids = ACHIEVEMENT_DEFINITIONS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of [
      "offline-hour", "offline-day", "offline-week", "offline-days-three",
      "offline-streak-seven", "first-building", "village", "city",
      "population-hundred", "mine-ten", "spaceport", "laboratory",
    ]) {
      expect(ids).toContain(id);
    }
  });

  it("follows space exploration: expeditions, colonies and cargo", () => {
    const user = new User();
    expect(progressOf(user, "first-expedition").unlocked).toBe(false);
    user.stats = { expeditionsLaunched: 3, cargoDeliveries: 2, cargoUnitsDelivered: 12_000 };
    user.addColony(new Colony({ foundedAt: 0, systemPlanetId: "a" }));
    user.addColony(new Colony({ foundedAt: 0, systemPlanetId: "b" }));
    expect(progressOf(user, "first-expedition").unlocked).toBe(true);
    expect(progressOf(user, "first-colony").unlocked).toBe(true);
    expect(progressOf(user, "first-cargo").unlocked).toBe(true);
    expect(progressOf(user, "star-empire")).toMatchObject({ progress: 2, unlocked: false });
    expect(progressOf(user, "space-bridge")).toMatchObject({ progress: 12_000, unlocked: false });

    // Only a colony counts for the distant city, not the starting planet.
    user.homeColony.planet.levels.habitat = 8;
    expect(progressOf(user, "distant-city").progress).toBe(0);
    user.colonies[1].planet.levels.habitat = 6;
    expect(progressOf(user, "distant-city").unlocked).toBe(true);
  });

  it("follows the notable inhabitants", () => {
    const user = new User("Joueur", 0);
    expect(progressOf(user, "leader-story").unlocked).toBe(false);
    user.updateNotable(user.leader!.id, { name: "Ada", title: "Gouverneure", description: "" });
    expect(progressOf(user, "leader-story").unlocked).toBe(true);

    user.advance(3 * 7 * 24 * HOUR, 0);
    expect(progressOf(user, "first-notable").unlocked).toBe(true);
    expect(progressOf(user, "colony-memory").progress).toBe(3);
    const [first] = user.weeklyNotables;
    user.updateNotable(first.id, { name: "Lia", title: "Ingénieure", description: "" });
    expect(progressOf(user, "chronicler").progress).toBe(1);
  });
});
