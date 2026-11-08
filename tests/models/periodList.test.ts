import { describe, expect, it } from "vitest";
import { PeriodList } from "../../src/models/periodList";
import {
  OPEN_PERIOD_HEARTBEAT_MS,
  UNOBSERVED_OFFLINE_CREDIT_CAP_MS as CAP,
} from "../../src/utils/constants";
import { HOUR, MINUTE, local } from "../helpers/time";

const T0 = local(2026, 1, 10, 8);

function openAt(start: number): PeriodList {
  const list = new PeriodList();
  list.openPeriodIfNeeded(start);
  return list;
}

describe("PeriodList", () => {
  describe("opening and closing", () => {
    it("credits an observed period entirely", () => {
      const list = openAt(T0);
      list.recordObservation(T0 + HOUR);

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
      const list = openAt(T0);
      list.openPeriodIfNeeded(T0 + HOUR);
      expect(list.openPeriodStart).toBe(T0);
    });

    it("does nothing when no period is open", () => {
      const list = new PeriodList();
      expect(list.closeAnyOpenPeriod(T0)).toBeUndefined();
      expect(list.days).toEqual([]);
    });

    it("records a period without duration on its start day", () => {
      const list = openAt(T0);
      expect(list.closeAnyOpenPeriod(T0)).toBe(0);
      expect(list.days).toHaveLength(1);
      expect(list.days[0].periodCount).toBe(1);
      expect(list.days[0].durationMs).toBe(0);
    });

    it("computes the running total of the open period", () => {
      const list = openAt(T0);
      list.recordObservation(T0 + 30 * MINUTE);
      expect(list.computeTotalMs(T0 + 45 * MINUTE)).toBe(45 * MINUTE);
      expect(list.getOpenPeriod()?.getPeriodDurationMs(T0 + 45 * MINUTE)).toBe(
        45 * MINUTE,
      );
    });
  });

  describe("daily aggregation", () => {
    it("splits a period across midnight and counts it once per day", () => {
      const list = openAt(local(2026, 1, 10, 22));
      list.closeAnyOpenPeriod(local(2026, 1, 11, 2));

      expect(list.days.map((day) => [day.dayStart, day.durationMs, day.periodCount])).toEqual([
        [local(2026, 1, 11), 2 * HOUR, 1],
        [local(2026, 1, 10), 2 * HOUR, 1],
      ]);
    });

    it("adds up several periods of the same day", () => {
      const list = openAt(T0);
      list.closeAnyOpenPeriod(T0 + HOUR);
      list.openPeriodIfNeeded(T0 + 3 * HOUR);
      list.closeAnyOpenPeriod(T0 + 5 * HOUR);

      expect(list.days).toHaveLength(1);
      expect(list.days[0]).toMatchObject({
        durationMs: 3 * HOUR,
        periodCount: 2,
        firstStart: T0,
        lastEnd: T0 + 5 * HOUR,
      });
      expect(list.computeCompletedMs()).toBe(3 * HOUR);
    });

    it("splits at local midnight on a daylight saving day", () => {
      // 29 March 2026: clocks go from 02:00 to 03:00 in Europe/Paris.
      const list = openAt(local(2026, 3, 28, 23));
      const credited = list.closeAnyOpenPeriod(local(2026, 3, 29, 4));

      expect(credited).toBe(4 * HOUR);
      expect(list.days.find((day) => day.dayStart === local(2026, 3, 28))?.durationMs).toBe(HOUR);
      expect(list.days.find((day) => day.dayStart === local(2026, 3, 29))?.durationMs).toBe(3 * HOUR);
    });
  });

  describe("unobserved time", () => {
    it("caps a gap during which the app could not observe the device", () => {
      const list = openAt(T0);
      expect(list.closeAnyOpenPeriod(T0 + CAP + 8 * HOUR)).toBe(CAP);
      expect(list.computeCompletedMs()).toBe(CAP);
    });

    it("keeps observed time and only caps the gap", () => {
      const list = openAt(T0);
      list.recordObservation(T0 + HOUR);
      const afterGap = T0 + HOUR + CAP + 2 * HOUR;
      list.recordObservation(afterGap);

      expect(list.computeTotalMs(afterGap)).toBe(HOUR + CAP);
      expect(list.getOpenPeriodExcludedMs()).toBe(2 * HOUR);
      expect(list.closeAnyOpenPeriod(afterGap + HOUR)).toBe(2 * HOUR + CAP);
    });

    it("credits a gap shorter than the cap", () => {
      const list = openAt(T0);
      expect(list.closeAnyOpenPeriod(T0 + CAP - MINUTE)).toBe(CAP - MINUTE);
    });

    it("ignores a clock that goes backwards", () => {
      const list = openAt(T0);
      list.recordObservation(T0 + 2 * HOUR);

      expect(list.recordObservation(T0 + HOUR)).toBe(false);
      expect(list.openPeriodLastSeen).toBe(T0 + 2 * HOUR);
    });

    it("asks for a heartbeat only after the heartbeat interval", () => {
      const list = openAt(T0);
      expect(new PeriodList().needsHeartbeat(T0)).toBe(false);
      expect(list.needsHeartbeat(T0 + OPEN_PERIOD_HEARTBEAT_MS - 1)).toBe(false);
      expect(list.needsHeartbeat(T0 + OPEN_PERIOD_HEARTBEAT_MS)).toBe(true);
    });
  });

  describe("loading saved data", () => {
    it("round-trips through JSON, exclusions included", () => {
      const list = openAt(T0);
      list.recordObservation(T0 + CAP + 3 * HOUR);

      const restored = new PeriodList();
      restored.loadPeriods(JSON.parse(JSON.stringify(list)));

      expect(restored).toEqual(list);
      expect(restored.computeTotalMs(T0 + CAP + 4 * HOUR)).toBe(CAP + HOUR);
    });

    it("treats an open period saved before the heartbeat as last seen at its start", () => {
      const list = new PeriodList();
      list.loadPeriods({ days: [], openPeriodStart: T0 });

      expect(list.openPeriodLastSeen).toBe(T0);
      expect(list.closeAnyOpenPeriod(T0 + CAP + HOUR)).toBe(CAP);
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

    it("drops invalid days and exclusions", () => {
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
      });

      expect(list.days).toEqual([
        { dayStart: 0, durationMs: 5, periodCount: 1, firstStart: 0, lastEnd: 5 },
      ]);
      expect(list.openPeriodExclusions).toEqual([]);
    });

    it.each([["garbage"], [42], [null], [{ days: "x" }], [{ __proto__: { days: [] } }]])(
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
    const list = openAt(T0);
    list.recordObservation(T0 + CAP + HOUR);
    const copy = list.clone();

    copy.closeAnyOpenPeriod(T0 + CAP + 2 * HOUR);

    expect(copy.openPeriodStart).toBeNull();
    expect(list.openPeriodStart).toBe(T0);
    expect(list.openPeriodExclusions).toHaveLength(1);
    expect(list.days).toEqual([]);
  });
});
