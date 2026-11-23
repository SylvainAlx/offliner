import { Period } from "./period";
import {
  NIGHT_CREDIT_CAP_MS,
  NIGHT_END_HOUR,
  OPEN_PERIOD_HEARTBEAT_MS,
  UNOBSERVED_GAP_THRESHOLD_MS,
  UNOBSERVED_OFFLINE_CREDIT_CAP_MS,
} from "../utils/constants";
import { isFiniteNumber, isRecord } from "../utils/sanitize";

export interface OfflineDay {
  dayStart: number;
  /** Credited offline time: the night part is capped (see nightMs). */
  durationMs: number;
  /**
   * Part of durationMs credited between midnight and NIGHT_END_HOUR; it never
   * goes beyond NIGHT_CREDIT_CAP_MS.
   */
  nightMs: number;
  periodCount: number;
  firstStart: number;
  lastEnd: number;
}

/** Part of an open period that is not credited. */
export interface ExcludedInterval {
  start: number;
  end: number;
}

export class PeriodList {
  days: OfflineDay[];
  openPeriodStart: number | null;
  /** Last time the app observed the device offline during the open period. */
  openPeriodLastSeen: number | null;
  openPeriodExclusions: ExcludedInterval[];
  /**
   * Stretches of time during which the app could not observe the device (in
   * the background, closed, device asleep) for longer than
   * UNOBSERVED_GAP_THRESHOLD_MS. They are not credited until the player says
   * they stayed offline, and they outlive the period they belong to.
   */
  unconfirmedGaps: ExcludedInterval[];

  constructor(
    days: OfflineDay[] = [],
    openPeriodStart: number | null = null,
    openPeriodLastSeen: number | null = openPeriodStart,
    openPeriodExclusions: ExcludedInterval[] = [],
    unconfirmedGaps: ExcludedInterval[] = [],
  ) {
    this.days = days;
    this.openPeriodStart = openPeriodStart;
    this.openPeriodLastSeen = openPeriodLastSeen;
    this.openPeriodExclusions = openPeriodExclusions;
    this.unconfirmedGaps = unconfirmedGaps;
  }

  clone(): PeriodList {
    return new PeriodList(
      this.days.map((day) => ({ ...day })),
      this.openPeriodStart,
      this.openPeriodLastSeen,
      this.openPeriodExclusions.map((interval) => ({ ...interval })),
      this.unconfirmedGaps.map((interval) => ({ ...interval })),
    );
  }

  loadPeriods(value: unknown): void {
    this.clearPeriods();
    if (!isRecord(value)) return;
    this.days = Array.isArray(value.days) ? value.days.filter(isOfflineDay).map(toOfflineDay) : [];
    this.sortDays();
    this.restoreOpenPeriod(value.openPeriodStart, value.openPeriodLastSeen, value.openPeriodExclusions);
    this.unconfirmedGaps = Array.isArray(value.unconfirmedGaps)
      ? value.unconfirmedGaps
          .filter(isExcludedInterval)
          .slice(-MAX_UNCONFIRMED_GAPS)
          .map((interval) => ({ start: interval.start, end: interval.end }))
      : [];
  }

  clearPeriods(): void {
    this.days = [];
    this.unconfirmedGaps = [];
    this.discardOpenPeriod();
  }

  discardOpenPeriod(): void {
    this.openPeriodStart = null;
    this.openPeriodLastSeen = null;
    this.openPeriodExclusions = [];
  }

  computeCompletedMs(): number {
    return this.days.reduce((total, day) => total + day.durationMs, 0);
  }

  getOpenPeriodExcludedMs(): number {
    return this.openPeriodExclusions.reduce(
      (total, interval) => total + (interval.end - interval.start),
      0,
    );
  }

  /**
   * Offline time credited at `now`: the closed days, plus the open period
   * without its excluded stretches, the night cap applied.
   */
  computeTotalMs(now?: number): number {
    const end = now ?? Date.now();
    return this.computeCompletedMs() + this.creditOpenPeriod(end).credited;
  }

  /**
   * Night time already credited for the night `now` belongs to, closed and
   * open periods together; null outside the night (NIGHT_END_HOUR onwards).
   */
  getNightCreditUsedMs(now: number): number | null {
    const date = new Date(now);
    if (date.getHours() >= NIGHT_END_HOUR) return null;
    const dayStart = getDayStart(now);
    const closed = this.days.find((day) => day.dayStart === dayStart)?.nightMs ?? 0;
    return this.creditOpenPeriod(now).nightUsed.get(dayStart) ?? closed;
  }

  /** What the open period credits up to `end`, and the night time per day. */
  private creditOpenPeriod(end: number): { credited: number; nightUsed: Map<number, number> } {
    // Night time the closed days already used, per day.
    const nightUsed = new Map(this.days.map((day) => [day.dayStart, day.nightMs]));
    let credited = 0;
    for (const [start, stop] of this.getOpenIntervals(end)) {
      forEachDaySegment(start, stop, (dayStart, segmentStart, segmentEnd) => {
        const used = nightUsed.get(dayStart) ?? 0;
        const credit = creditSegment(dayStart, segmentStart, segmentEnd, used);
        nightUsed.set(dayStart, used + credit.nightMs);
        credited += credit.durationMs;
      });
    }
    return { credited, nightUsed };
  }

  /** The open period from its start to `end`, without its excluded stretches. */
  private getOpenIntervals(end: number): Array<[number, number]> {
    if (this.openPeriodStart === null) return [];
    const exclusions = [...this.openPeriodExclusions].sort((left, right) => left.start - right.start);
    const intervals: Array<[number, number]> = [];
    let cursor = this.openPeriodStart;
    for (const interval of exclusions) {
      const stop = Math.min(interval.start, end);
      if (stop > cursor) intervals.push([cursor, stop]);
      cursor = Math.max(cursor, interval.end);
    }
    if (end > cursor) intervals.push([cursor, end]);
    return intervals;
  }

  getOpenPeriod(): Period | null {
    return this.openPeriodStart === null
      ? null
      : new Period(this.openPeriodStart, null, this.getOpenPeriodExcludedMs());
  }

  /**
   * Records that the device is observed offline at `now`. When the previous
   * observation is older than UNOBSERVED_GAP_THRESHOLD_MS (app in the
   * background, closed, device asleep), nothing proves the device stayed
   * offline meanwhile: that stretch is excluded and kept as an unconfirmed gap
   * until the player answers. Returns true when the open period changed.
   */
  recordObservation(now: number): boolean {
    if (this.openPeriodStart === null) return false;

    const lastSeen = this.openPeriodLastSeen ?? this.openPeriodStart;
    // Ignore clocks going backwards: never shorten what was already observed.
    if (now <= lastSeen) return false;

    if (now - lastSeen > UNOBSERVED_GAP_THRESHOLD_MS) {
      const gap = { start: lastSeen, end: now };
      this.openPeriodExclusions.push(gap);
      this.unconfirmedGaps.push({ ...gap });
      // Unanswered for too long: the oldest gaps can no longer be credited.
      if (this.unconfirmedGaps.length > MAX_UNCONFIRMED_GAPS) {
        this.unconfirmedGaps.splice(0, this.unconfirmedGaps.length - MAX_UNCONFIRMED_GAPS);
      }
    }
    this.openPeriodLastSeen = now;
    return true;
  }

  getUnconfirmedGapsMs(): number {
    return this.unconfirmedGaps.reduce(
      (total, gap) => total + (gap.end - gap.start),
      0,
    );
  }

  /**
   * Applies the player's answer to the unconfirmed gaps. Confirmed gaps are
   * credited up to `capMs` each, whether their period is still open or not;
   * denied gaps stay excluded. Returns the credited duration.
   */
  resolveUnconfirmedGaps(
    stayedOffline: boolean,
    capMs: number = UNOBSERVED_OFFLINE_CREDIT_CAP_MS,
  ): number {
    const gaps = this.unconfirmedGaps;
    this.unconfirmedGaps = [];
    if (!stayedOffline) return 0;

    let credited = 0;
    for (const gap of gaps) {
      const creditedEnd = Math.min(gap.end, gap.start + capMs);
      const exclusionIndex = this.openPeriodExclusions.findIndex(
        (interval) => interval.start === gap.start && interval.end === gap.end,
      );

      if (exclusionIndex !== -1) {
        // Still part of the open period: only the time beyond the cap stays excluded.
        if (creditedEnd < gap.end) {
          this.openPeriodExclusions[exclusionIndex] = { start: creditedEnd, end: gap.end };
        } else {
          this.openPeriodExclusions.splice(exclusionIndex, 1);
        }
        credited += creditedEnd - gap.start;
      } else {
        // The period was closed meanwhile: add the time to its days.
        const countedDays = new Set(this.days.map((day) => day.dayStart));
        credited += this.aggregatePeriod(gap.start, creditedEnd, countedDays);
        this.sortDays();
      }
    }
    return credited;
  }

  needsHeartbeat(now: number): boolean {
    if (this.openPeriodStart === null) return false;
    const lastSeen = this.openPeriodLastSeen ?? this.openPeriodStart;
    return now - lastSeen >= OPEN_PERIOD_HEARTBEAT_MS;
  }

  /** Closes the open period and returns its credited duration. */
  closeAnyOpenPeriod(endTs: number): number | undefined {
    if (this.openPeriodStart === null) return;

    this.recordObservation(endTs);
    const start = this.openPeriodStart;
    const countedDays = new Set<number>();
    let credited = 0;
    for (const [segmentStart, segmentEnd] of this.getOpenIntervals(endTs)) {
      credited += this.aggregatePeriod(segmentStart, segmentEnd, countedDays);
    }

    // A period with no credited time is still recorded on its start day.
    if (countedDays.size === 0) {
      this.addDaySegment(getDayStart(start), 0, 0, start, start, true);
    }

    this.sortDays();
    this.discardOpenPeriod();
    return credited;
  }

  openPeriodIfNeeded(startTs: number): void {
    if (this.openPeriodStart !== null) return;
    this.openPeriodStart = startTs;
    this.openPeriodLastSeen = startTs;
    this.openPeriodExclusions = [];
  }

  private restoreOpenPeriod(
    start: unknown,
    lastSeen: unknown,
    exclusions: unknown,
  ): void {
    this.discardOpenPeriod();
    if (!isFiniteNumber(start)) return;

    this.openPeriodStart = start;
    // Without a valid last observation, the unobserved time is counted from
    // the start of the period.
    this.openPeriodLastSeen =
      isFiniteNumber(lastSeen) && lastSeen >= start ? lastSeen : start;
    this.openPeriodExclusions = Array.isArray(exclusions)
      ? exclusions
          .filter(isExcludedInterval)
          .filter(
            (interval) =>
              interval.start >= start &&
              interval.end <= (this.openPeriodLastSeen ?? start),
          )
          .map((interval) => ({ start: interval.start, end: interval.end }))
      : [];
  }

  /**
   * Adds [start, end] to the daily totals, the night cap applied, and returns
   * the credited duration.
   */
  private aggregatePeriod(
    start: number,
    end: number,
    countedDays: Set<number>,
  ): number {
    let credited = 0;
    forEachDaySegment(start, end, (dayStart, segmentStart, segmentEnd) => {
      const nightUsed = this.days.find((day) => day.dayStart === dayStart)?.nightMs ?? 0;
      const credit = creditSegment(dayStart, segmentStart, segmentEnd, nightUsed);
      this.addDaySegment(
        dayStart,
        credit.durationMs,
        credit.nightMs,
        segmentStart,
        segmentEnd,
        !countedDays.has(dayStart),
      );
      countedDays.add(dayStart);
      credited += credit.durationMs;
    });
    return credited;
  }

  private addDaySegment(
    dayStart: number,
    durationMs: number,
    nightMs: number,
    segmentStart: number,
    segmentEnd: number,
    countAsNewPeriod: boolean,
  ): void {
    const existing = this.days.find((day) => day.dayStart === dayStart);
    if (existing) {
      existing.durationMs += durationMs;
      existing.nightMs += nightMs;
      if (countAsNewPeriod) existing.periodCount += 1;
      existing.firstStart = Math.min(existing.firstStart, segmentStart);
      existing.lastEnd = Math.max(existing.lastEnd, segmentEnd);
      return;
    }

    this.days.push({
      dayStart,
      durationMs,
      nightMs,
      periodCount: countAsNewPeriod ? 1 : 0,
      firstStart: segmentStart,
      lastEnd: segmentEnd,
    });
  }

  private sortDays(): void {
    this.days.sort((left, right) => right.dayStart - left.dayStart);
  }
}

const MAX_UNCONFIRMED_GAPS = 50;

function getDayStart(timestamp: number): number {
  const date = new Date(timestamp);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function getNextDayStart(dayStart: number): number {
  const date = new Date(dayStart);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime();
}

/** Calls `visit` with each part of [start, end) that falls within one local day. */
function forEachDaySegment(
  start: number,
  end: number,
  visit: (dayStart: number, segmentStart: number, segmentEnd: number) => void,
): void {
  let cursor = start;
  while (cursor < end) {
    const dayStart = getDayStart(cursor);
    const segmentEnd = Math.min(end, getNextDayStart(dayStart));
    visit(dayStart, cursor, segmentEnd);
    cursor = segmentEnd;
  }
}

/**
 * Credit for [start, end) within the day starting at `dayStart`, given the
 * night time that day already credited: the part between midnight and
 * NIGHT_END_HOUR only counts up to NIGHT_CREDIT_CAP_MS per night.
 */
function creditSegment(
  dayStart: number,
  start: number,
  end: number,
  nightUsed: number,
): { durationMs: number; nightMs: number } {
  const date = new Date(dayStart);
  const nightEnd = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    NIGHT_END_HOUR,
  ).getTime();
  const night = Math.max(0, Math.min(end, nightEnd) - Math.max(start, dayStart));
  const nightMs = Math.min(night, Math.max(0, NIGHT_CREDIT_CAP_MS - nightUsed));
  return { durationMs: end - start - night + nightMs, nightMs };
}

function isOfflineDay(value: unknown): value is OfflineDay {
  if (!isRecord(value)) return false;
  return (
    isFiniteNumber(value.dayStart) &&
    isFiniteNumber(value.durationMs) &&
    value.durationMs >= 0 &&
    isFiniteNumber(value.periodCount) &&
    value.periodCount >= 0 &&
    isFiniteNumber(value.firstStart) &&
    isFiniteNumber(value.lastEnd)
  );
}

function toOfflineDay(day: OfflineDay): OfflineDay {
  return {
    dayStart: day.dayStart,
    durationMs: day.durationMs,
    // Days saved before the night cap have not used any of it.
    nightMs: isFiniteNumber(day.nightMs) && day.nightMs >= 0 ? day.nightMs : 0,
    periodCount: Math.floor(day.periodCount),
    firstStart: day.firstStart,
    lastEnd: day.lastEnd,
  };
}

function isExcludedInterval(value: unknown): value is ExcludedInterval {
  return (
    isRecord(value) &&
    isFiniteNumber(value.start) &&
    isFiniteNumber(value.end) &&
    value.start < value.end
  );
}
