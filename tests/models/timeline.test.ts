import { describe, expect, it } from "vitest";
import { Village } from "../../src/models/village";
import { Companion } from "../../src/models/companion";
import { User } from "../../src/models/user";
import { getBuildingConstructionMs } from "../../src/models/building";
import { getQueueEndOfflineMs, getVillageEvents } from "../../src/models/timeline";
import {
  COMPANION_INVOCATION_OFFLINE_MS,
  COMPANION_STAGE_AGE_MS,
  OFFLINIUM_DELIVERY_INTERVAL as INTERVAL,
} from "../../src/utils/constants";
import { HOUR, local } from "../helpers/time";
import { observeOffline } from "../helpers/periods";

const T0 = local(2026, 1, 10, 8);

describe("village events", () => {
  it("lists what the queue schedules, in order", () => {
    const village = new Village();
    village.addPendingElement("house", 0);
    village.addPendingElement("companion", 0);
    const house = getBuildingConstructionMs("house", 1);

    expect(getVillageEvents(village, 0, 2 * HOUR)).toEqual([
      { kind: "building", at: house, type: "house", level: 1 },
      { kind: "companionArrived", at: house + COMPANION_INVOCATION_OFFLINE_MS, name: null },
      {
        kind: "companionStage",
        at: house + COMPANION_INVOCATION_OFFLINE_MS + COMPANION_STAGE_AGE_MS.adolescent,
        name: null,
        stage: "adolescent",
      },
    ]);
    expect(getQueueEndOfflineMs(village)).toBe(house + COMPANION_INVOCATION_OFFLINE_MS);
  });

  it("tells the stages companions reach, death included", () => {
    const village = new Village();
    const companion = new Companion(0);
    companion.name = "Lumo";
    village.addCompanion(companion);

    const events = getVillageEvents(village, COMPANION_STAGE_AGE_MS.adult, COMPANION_STAGE_AGE_MS.dead);
    expect(events.map((event) => event.kind === "companionStage" && event.stage)).toEqual([
      "sage",
      "dead",
    ]);
  });

  it("reads levels already reached, but only inside the window", () => {
    const village = new Village();
    village.setBuildingLevel("quarry", 2, 5000);

    expect(getVillageEvents(village, 0, 5000)).toHaveLength(1);
    expect(getVillageEvents(village, 5000, 10_000)).toEqual([]);
  });
});

describe("absence report", () => {
  it("reports the harvest and the events of an absence once back online", () => {
    const user = new User();
    user.village.setBuildingLevel("house", 1);
    user.offlinium = 10_000;
    expect(user.invokeCompanion(0)).toBe(true);

    user.openOfflinePeriod(T0);
    observeOffline(user.periodList, T0, T0 + 2 * HOUR);
    expect(user.getAbsenceReport(2 * HOUR)).toBeNull(); // still offline

    user.closeOfflinePeriod(T0 + 2 * HOUR);
    const total = user.periodList.computeTotalMs(T0 + 2 * HOUR);
    const report = user.getAbsenceReport(total)!;

    expect(report.offlineMs).toBe(2 * HOUR);
    expect(report.startedAt).toBe(T0);
    expect(report.endedAt).toBe(T0 + 2 * HOUR);
    expect(report.events.map((event) => event.kind)).toEqual([
      "companionArrived",
      "companionStage",
    ]);
    // Base rate for 2 h, plus the adolescent's bonus after its first hour.
    const bornAt = COMPANION_INVOCATION_OFFLINE_MS;
    const adolescentAt = bornAt + COMPANION_STAGE_AGE_MS.adolescent;
    expect(report.gains.offlinium).toBe(
      (2 * HOUR) / INTERVAL + Math.floor((2 * HOUR - adolescentAt) / INTERVAL),
    );
  });

  it("does not count spending as a loss", () => {
    const user = new User();
    user.openOfflinePeriod(T0);
    observeOffline(user.periodList, T0, T0 + HOUR);
    const total = user.periodList.computeTotalMs(T0 + HOUR);
    expect(user.spendOfflinium(100, total)).toBe(true);
    user.closeOfflinePeriod(T0 + HOUR);

    expect(user.getAbsenceReport(total)!.gains.offlinium).toBe(HOUR / INTERVAL);
  });

  it("keeps adding periods to an unread report, and forgets it once dismissed", () => {
    const user = new User();
    user.openOfflinePeriod(T0);
    observeOffline(user.periodList, T0, T0 + HOUR);
    user.closeOfflinePeriod(T0 + HOUR);

    user.openOfflinePeriod(T0 + 2 * HOUR);
    observeOffline(user.periodList, T0 + 2 * HOUR, T0 + 3 * HOUR);
    user.closeOfflinePeriod(T0 + 3 * HOUR);

    const total = user.periodList.computeTotalMs(T0 + 3 * HOUR);
    expect(user.getAbsenceReport(total)).toMatchObject({ startedAt: T0, offlineMs: 2 * HOUR });

    user.dismissAbsenceReport();
    expect(user.getAbsenceReport(total)).toBeNull();
  });

  it("survives a save and a clone", () => {
    const user = new User();
    user.openOfflinePeriod(T0);
    observeOffline(user.periodList, T0, T0 + HOUR);
    user.closeOfflinePeriod(T0 + HOUR);
    user.settleHarvest(HOUR);

    const restored = new User();
    restored.loadFromSnapshot(JSON.parse(JSON.stringify(user)));
    expect(restored.absence).toEqual(user.absence);
    expect(restored.harvested).toEqual(user.harvested);

    const copy = user.clone();
    copy.absence!.harvestedAtStart.offlinium = 99;
    expect(user.absence!.harvestedAtStart.offlinium).toBe(0);
  });
});
