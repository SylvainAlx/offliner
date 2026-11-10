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

  describe("loading saved data", () => {
    it("round-trips through JSON, exclusions and pending gaps included", () => {
      const list = observed(T0, T0 + HOUR);
      list.recordObservation(T0 + 6 * HOUR);

      const restored = new PeriodList();
      restored.loadPeriods(JSON.parse(JSON.stringify(list)));

      expect(restored).toEqual(list);
      expect(restored.unconfirmedGaps).toHaveLength(1);
    });

    it("treats an open period saved before the heartbeat as last seen at its start", () => {
      const list = new PeriodList();
      list.loadPeriods({ days: [], openPeriodStart: T0 });

      expect(list.openPeriodLastSeen).toBe(T0);
      list.recordObservation(T0 + 20 * HOUR);
      expect(list.unconfirmedGaps).toEqual([{ start: T0, end: T0 + 20 * HOUR }]);
    });

    it("migrates the legacy one-entry-per-session format", () => {
      const list = new PeriodList();
      list.loadPeriods([
        { start: T0, end: T0 + HOUR },
        { start: T0 + 2 * HOUR, end: null },
      ]);

      expect(list.computeCompletedMs()).toBe(HOUR);
      expect(list.openPeriodStart).toBe(T0 + 2 * HOUR);
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

      expect(list.days).toEqual([
        { dayStart: 0, durationMs: 5, periodCount: 1, firstStart: 0, lastEnd: 5 },
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
