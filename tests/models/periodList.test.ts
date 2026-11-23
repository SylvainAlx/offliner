import { describe, expect, it } from "vitest";
import { PeriodList } from "../../src/models/periodList";
import {
  OPEN_PERIOD_HEARTBEAT_MS,
  UNOBSERVED_GAP_THRESHOLD_MS as THRESHOLD,
  UNOBSERVED_OFFLINE_CREDIT_CAP_MS as CAP,
} from "../../src/utils/constants";
import { HOUR, MINUTE, local } from "../helpers/time";
import { observeOffline } from "../helpers/periods";

const T0 = local(2026, 1, 10, 8);

function observed(start: number, end: number): PeriodList {
  const list = new PeriodList();
  observeOffline(list, start, end);
  return list;
}

describe("PeriodList", () => {
  describe("opening and closing", () => {
    it("credits an observed period entirely", () => {
      const list = observed(T0, T0 + 2 * HOUR);

      expect(list.closeAnyOpenPeriod(T0 + 2 * HOUR)).toBe(2 * HOUR);
      expect(list.openPeriodStart).toBeNull();
      expect(list.days).toEqual([
        {
          dayStart: local(2026, 1, 10),
          durationMs: 2 * HOUR,
          nightMs: 0,
          periodCount: 1,
          firstStart: T0,
          lastEnd: T0 + 2 * HOUR,
        },
      ]);
    });

    it("keeps the first start when a period is already open", () => {
      const list = new PeriodList();
      list.openPeriodIfNeeded(T0);
      list.openPeriodIfNeeded(T0 + HOUR);
      expect(list.openPeriodStart).toBe(T0);
    });

    it("does nothing when no period is open", () => {
      const list = new PeriodList();
      expect(list.closeAnyOpenPeriod(T0)).toBeUndefined();
      expect(list.days).toEqual([]);
    });

    it("records a period without duration on its start day", () => {
      const list = new PeriodList();
      list.openPeriodIfNeeded(T0);
      expect(list.closeAnyOpenPeriod(T0)).toBe(0);
      expect(list.days).toHaveLength(1);
      expect(list.days[0].periodCount).toBe(1);
    });

    it("computes the running total of the open period", () => {
      const list = observed(T0, T0 + 45 * MINUTE);
      expect(list.computeTotalMs(T0 + 45 * MINUTE)).toBe(45 * MINUTE);
      expect(list.getOpenPeriod()?.getPeriodDurationMs(T0 + 45 * MINUTE)).toBe(45 * MINUTE);
    });
  });

  describe("daily aggregation", () => {
    it("splits a period across midnight and counts it once per day", () => {
      const list = observed(local(2026, 1, 10, 22), local(2026, 1, 11, 2));
      list.closeAnyOpenPeriod(local(2026, 1, 11, 2));

      expect(list.days.map((day) => [day.dayStart, day.durationMs, day.periodCount])).toEqual([
        [local(2026, 1, 11), 2 * HOUR, 1],
        [local(2026, 1, 10), 2 * HOUR, 1],
      ]);
    });

    it("adds up several periods of the same day", () => {
      const list = observed(T0, T0 + HOUR);
      list.closeAnyOpenPeriod(T0 + HOUR);
      observeOffline(list, T0 + 3 * HOUR, T0 + 5 * HOUR);
      list.closeAnyOpenPeriod(T0 + 5 * HOUR);

      expect(list.days).toHaveLength(1);
      expect(list.days[0]).toMatchObject({
        durationMs: 3 * HOUR,
        periodCount: 2,
        firstStart: T0,
        lastEnd: T0 + 5 * HOUR,
      });
    });

    it("splits at local midnight on a daylight saving day", () => {
      // 29 March 2026: clocks go from 02:00 to 03:00 in Europe/Paris.
      const start = local(2026, 3, 28, 23);
      const end = local(2026, 3, 29, 4);
      const list = observed(start, end);

      expect(list.closeAnyOpenPeriod(end)).toBe(4 * HOUR);
      expect(list.days.find((day) => day.dayStart === local(2026, 3, 28))?.durationMs).toBe(HOUR);
      expect(list.days.find((day) => day.dayStart === local(2026, 3, 29))?.durationMs).toBe(3 * HOUR);
    });
  });

  describe("time the app could not observe", () => {
    it("credits a short absence without asking", () => {
      const list = new PeriodList();
      list.openPeriodIfNeeded(T0);
      expect(list.closeAnyOpenPeriod(T0 + THRESHOLD)).toBe(THRESHOLD);
      expect(list.unconfirmedGaps).toEqual([]);
    });

    it("keeps a longer absence out until the player answers", () => {
      const list = observed(T0, T0 + HOUR);
      list.recordObservation(T0 + 5 * HOUR);

      expect(list.unconfirmedGaps).toHaveLength(1);
      expect(list.getUnconfirmedGapsMs()).toBeGreaterThan(3 * HOUR);
      expect(list.computeTotalMs(T0 + 5 * HOUR)).toBeLessThan(HOUR + 1);
    });

    it("credits a confirmed absence while the period is still open", () => {
      const list = observed(T0, T0 + HOUR);
      const lastSeen = list.openPeriodLastSeen!;
      list.recordObservation(lastSeen + 4 * HOUR);

      expect(list.resolveUnconfirmedGaps(true)).toBe(4 * HOUR);
      expect(list.computeTotalMs(lastSeen + 4 * HOUR)).toBe(lastSeen + 4 * HOUR - T0);
      expect(list.unconfirmedGaps).toEqual([]);
    });

    it("caps a confirmed absence", () => {
      const list = new PeriodList();
      list.openPeriodIfNeeded(T0);
      list.recordObservation(T0 + CAP + 8 * HOUR);

      expect(list.resolveUnconfirmedGaps(true)).toBe(CAP);
      expect(list.computeTotalMs(T0 + CAP + 8 * HOUR)).toBe(CAP);
    });

    it("credits a confirmed absence after the period was closed", () => {
      // The app comes back online: the period ends at the last observation.
      const list = new PeriodList();
      list.openPeriodIfNeeded(T0);
      expect(list.closeAnyOpenPeriod(T0 + 3 * HOUR)).toBe(0);
      expect(list.unconfirmedGaps).toHaveLength(1);

      expect(list.resolveUnconfirmedGaps(true)).toBe(3 * HOUR);
      expect(list.computeCompletedMs()).toBe(3 * HOUR);
      expect(list.days).toHaveLength(1);
      expect(list.days[0].periodCount).toBe(1);
    });

    it("credits nothing when the player reconnected", () => {
      const list = new PeriodList();
      list.openPeriodIfNeeded(T0);
      list.closeAnyOpenPeriod(T0 + 20 * HOUR);

      expect(list.resolveUnconfirmedGaps(false)).toBe(0);
      expect(list.computeCompletedMs()).toBe(0);
      expect(list.unconfirmedGaps).toEqual([]);
    });

    it("ignores a clock that goes backwards", () => {
      const list = observed(T0, T0 + 2 * HOUR);
      const lastSeen = list.openPeriodLastSeen;

      expect(list.recordObservation(T0)).toBe(false);
      expect(list.openPeriodLastSeen).toBe(lastSeen);
    });

    it("asks for a heartbeat only after the heartbeat interval", () => {
      const list = new PeriodList();
      list.openPeriodIfNeeded(T0);
      expect(new PeriodList().needsHeartbeat(T0)).toBe(false);
      expect(list.needsHeartbeat(T0 + OPEN_PERIOD_HEARTBEAT_MS - 1)).toBe(false);
      expect(list.needsHeartbeat(T0 + OPEN_PERIOD_HEARTBEAT_MS)).toBe(true);
    });
  });

  describe("night cap", () => {
    const evening = local(2026, 1, 10, 23);
    const midnight = local(2026, 1, 11, 0);

    it("credits at most 3 hours between midnight and 7 am", () => {
      // 23:00 → 09:00: 1 h the evening before, 3 h of night, 2 h after 7 am.
      const list = observed(evening, local(2026, 1, 11, 9));
      list.closeAnyOpenPeriod(local(2026, 1, 11, 9));
      expect(list.computeTotalMs()).toBe(6 * HOUR);
      const night = list.days.find((day) => day.dayStart === midnight)!;
      expect(night).toMatchObject({ durationMs: 5 * HOUR, nightMs: 3 * HOUR });
      expect(list.days.find((day) => day.dayStart === local(2026, 1, 10))!.durationMs).toBe(HOUR);
    });

    it("stops counting an open period once the night's 3 hours are used, then resumes at 7 am", () => {
      const list = observed(evening, local(2026, 1, 11, 9));
      // Reopened as a single open period observed all night long.
      expect(list.computeTotalMs(local(2026, 1, 11, 2))).toBe(3 * HOUR);
      expect(list.computeTotalMs(local(2026, 1, 11, 3))).toBe(4 * HOUR);
      expect(list.computeTotalMs(local(2026, 1, 11, 6))).toBe(4 * HOUR);
      expect(list.computeTotalMs(local(2026, 1, 11, 8))).toBe(5 * HOUR);
      // Closing it gives the same credit as the open period showed.
      list.closeAnyOpenPeriod(local(2026, 1, 11, 8));
      expect(list.computeTotalMs()).toBe(5 * HOUR);
    });

    it("shares the 3 hours between all the periods of one night", () => {
      const list = new PeriodList();
      observeOffline(list, midnight, local(2026, 1, 11, 2));
      list.closeAnyOpenPeriod(local(2026, 1, 11, 2));
      observeOffline(list, local(2026, 1, 11, 3), local(2026, 1, 11, 5));
      expect(list.computeTotalMs(local(2026, 1, 11, 5))).toBe(3 * HOUR);
      list.closeAnyOpenPeriod(local(2026, 1, 11, 5));
      expect(list.computeTotalMs()).toBe(3 * HOUR);
      // The next night has its own 3 hours; daytime is never capped.
      observeOffline(list, local(2026, 1, 12, 0), local(2026, 1, 12, 12));
      list.closeAnyOpenPeriod(local(2026, 1, 12, 12));
      expect(list.computeTotalMs()).toBe(3 * HOUR + 3 * HOUR + 5 * HOUR);
    });

    it("tells how much of the night is already counted", () => {
      const list = observed(evening, local(2026, 1, 11, 9));
      expect(list.getNightCreditUsedMs(local(2026, 1, 10, 23, 30))).toBeNull();
      expect(list.getNightCreditUsedMs(local(2026, 1, 11, 1))).toBe(HOUR);
      expect(list.getNightCreditUsedMs(local(2026, 1, 11, 5))).toBe(3 * HOUR);
      expect(list.getNightCreditUsedMs(local(2026, 1, 11, 7))).toBeNull();
      list.closeAnyOpenPeriod(local(2026, 1, 11, 2));
      expect(list.getNightCreditUsedMs(local(2026, 1, 11, 4))).toBe(2 * HOUR);
    });

    it("applies to a confirmed absence too", () => {
      const list = new PeriodList();
      list.openPeriodIfNeeded(evening);
      // The app could not see the device from 23:00 to 08:00.
      list.closeAnyOpenPeriod(local(2026, 1, 11, 8));
      expect(list.computeTotalMs()).toBe(0);
      list.resolveUnconfirmedGaps(true);
      expect(list.computeTotalMs()).toBe(HOUR + 3 * HOUR + HOUR);
    });
  });

  describe("loading saved data", () => {
    it("round-trips through JSON, exclusions and pending gaps included", () => {
      const list = observed(T0, T0 + HOUR);
      list.recordObservation(T0 + 6 * HOUR);

      const restored = new PeriodList();
      restored.loadPeriods(JSON.parse(JSON.stringify(list)));

      expect(restored).toEqual(list);
      expect(restored.unconfirmedGaps).toHaveLength(1);
    });

    it("treats an open period without a last observation as last seen at its start", () => {
      const list = new PeriodList();
      list.loadPeriods({ days: [], openPeriodStart: T0 });

      expect(list.openPeriodLastSeen).toBe(T0);
      list.recordObservation(T0 + 20 * HOUR);
      expect(list.unconfirmedGaps).toEqual([{ start: T0, end: T0 + 20 * HOUR }]);
    });

    it("drops invalid days, exclusions and gaps", () => {
      const list = new PeriodList();
      list.loadPeriods({
        days: [
          { dayStart: 0, durationMs: -5, periodCount: 1, firstStart: 0, lastEnd: 0 },
          { dayStart: "x", durationMs: 5, periodCount: 1, firstStart: 0, lastEnd: 0 },
          null,
          { dayStart: 0, durationMs: 5, periodCount: 1, firstStart: 0, lastEnd: 5 },
        ],
        openPeriodStart: T0,
        openPeriodLastSeen: T0 + HOUR,
        openPeriodExclusions: [
          { start: T0 - HOUR, end: T0 },
          { start: T0 + 30 * MINUTE, end: T0 + 2 * HOUR },
          { start: 5, end: 1 },
        ],
        unconfirmedGaps: [{ start: 5, end: 1 }, "x", { start: T0, end: T0 + HOUR }],
      });

      // A day without its night time has not used any of the night cap.
      expect(list.days).toEqual([
        { dayStart: 0, durationMs: 5, nightMs: 0, periodCount: 1, firstStart: 0, lastEnd: 5 },
      ]);
      expect(list.openPeriodExclusions).toEqual([]);
      expect(list.unconfirmedGaps).toEqual([{ start: T0, end: T0 + HOUR }]);
    });

    it.each([["garbage"], [42], [null], [{ days: "x" }]])(
      "survives unusable input %#",
      (input) => {
        const list = new PeriodList();
        list.loadPeriods(input);
        expect(list.days).toEqual([]);
        expect(list.openPeriodStart).toBeNull();
      },
    );
  });

  it("clones without sharing state", () => {
    const list = observed(T0, T0 + HOUR);
    list.recordObservation(T0 + 5 * HOUR);
    const copy = list.clone();

    copy.closeAnyOpenPeriod(T0 + 6 * HOUR);
    copy.resolveUnconfirmedGaps(true);

    expect(copy.openPeriodStart).toBeNull();
    expect(list.openPeriodStart).toBe(T0);
    expect(list.unconfirmedGaps).toHaveLength(1);
    expect(list.days).toEqual([]);
  });
});
