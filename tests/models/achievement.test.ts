import { describe, expect, it } from "vitest";
import { getAchievements } from "../../src/models/achievement";
import { User } from "../../src/models/user";
import { HOUR, local } from "../helpers/time";

function userOfflineOn(days: Array<[number, number, number]>): User {
  const user = new User();
  for (const [year, month, day] of days) {
    user.periodList.openPeriodIfNeeded(local(year, month, day, 10));
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
});
