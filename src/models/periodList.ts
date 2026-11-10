import { Period } from "./period";
import {
  OPEN_PERIOD_HEARTBEAT_MS,
  UNOBSERVED_GAP_THRESHOLD_MS,
  UNOBSERVED_OFFLINE_CREDIT_CAP_MS,
} from "../utils/constants";
import { isFiniteNumber, isRecord } from "../utils/sanitize";

export interface OfflineDay {
  dayStart: number;
  durationMs: number;
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

  loadPeriods(rawPeriods: unknown = []): void {
    try {
      const candidate = getCandidate(rawPeriods);
      if (candidate && !Array.isArray(candidate) && Array.isArray(candidate.days)) {
        this.days = candidate.days.filter(isOfflineDay).map(toOfflineDay);
        this.sortDays();
        this.restoreOpenPeriod(
          candidate.openPeriodStart,
          candidate.openPeriodLastSeen,
          candidate.openPeriodExclusions,
        );
        this.unconfirmedGaps = Array.isArray(candidate.unconfirmedGaps)
          ? candidate.unconfirmedGaps
              .filter(isExcludedInterval)
              .slice(-MAX_UNCONFIRMED_GAPS)
              .map((interval) => ({ start: interval.start, end: interval.end }))
          : [];
        return;
      }

      // Older saves contain one Period object per offline session. Compact them
      // into daily entries as they are loaded.
      const legacyPeriods = Array.isArray(candidate)
        ? candidate
        : candidate && Array.isArray(candidate.periods)
          ? candidate.periods
          : [];
      this.clearPeriods();

      let openStart: number | null = null;
      legacyPeriods.filter(isStoredPeriod).forEach((period) => {
        const start = Number(period.start);
        if (period.end === null || period.end === undefined) {
          if (openStart === null || start < openStart) openStart = start;
          return;
        }
        this.aggregatePeriod(start, Number(period.end), new Set());
      });
      this.sortDays();
      this.restoreOpenPeriod(openStart, null, null);
    } catch {
      this.clearPeriods();
    }
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

  computeTotalMs(now?: number): number {
    const openDuration =
      this.openPeriodStart === null
        ? 0
        : Math.max(
            0,
            (now ?? Date.now()) -
              this.openPeriodStart -
              this.getOpenPeriodExcludedMs(),
          );
    return this.computeCompletedMs() + openDuration;
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
      } else {
        // The period was closed meanwhile: add the time to its days.
        const countedDays = new Set(this.days.map((day) => day.dayStart));
        this.aggregatePeriod(gap.start, creditedEnd, countedDays);
        this.sortDays();
      }
      credited += creditedEnd - gap.start;
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
    const exclusions = [...this.openPeriodExclusions].sort(
      (left, right) => left.start - right.start,
    );
    const countedDays = new Set<number>();
    let credited = 0;
    let cursor = start;

    for (const interval of exclusions) {
      credited += this.aggregatePeriod(
        cursor,
        Math.min(interval.start, endTs),
        countedDays,
      );
      cursor = Math.max(cursor, interval.end);
    }
    credited += this.aggregatePeriod(cursor, endTs, countedDays);

    // A period with no credited time is still recorded on its start day.
    if (countedDays.size === 0) {
      this.addDaySegment(getDayStart(start), 0, start, start, true);
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
    // Saves created before the heartbeat existed only know the start: the
    // unobserved time is therefore counted from the start of the period.
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

  /** Adds [start, end] to the daily totals and returns the added duration. */
  private aggregatePeriod(
    start: number,
    end: number,
    countedDays: Set<number>,
  ): number {
    if (end <= start) return 0;

    let cursor = start;
    while (cursor < end) {
      const dayStart = getDayStart(cursor);
      const nextDayStart = getNextDayStart(dayStart);
      const segmentEnd = Math.min(end, nextDayStart);
      this.addDaySegment(
        dayStart,
        segmentEnd - cursor,
        cursor,
        segmentEnd,
        !countedDays.has(dayStart),
      );
      countedDays.add(dayStart);
      cursor = segmentEnd;
    }
    return end - start;
  }

  private addDaySegment(
    dayStart: number,
    durationMs: number,
    segmentStart: number,
    segmentEnd: number,
    countAsNewPeriod: boolean,
  ): void {
    const existing = this.days.find((day) => day.dayStart === dayStart);
    if (existing) {
      existing.durationMs += durationMs;
      if (countAsNewPeriod) existing.periodCount += 1;
      existing.firstStart = Math.min(existing.firstStart, segmentStart);
      existing.lastEnd = Math.max(existing.lastEnd, segmentEnd);
      return;
    }

    this.days.push({
      dayStart,
      durationMs,
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

type PeriodCandidate = {
  unconfirmedGaps?: unknown;
  days?: unknown;
  openPeriodStart?: unknown;
  openPeriodLastSeen?: unknown;
  openPeriodExclusions?: unknown;
  periods?: unknown;
};

function getCandidate(rawPeriods: unknown): PeriodCandidate | unknown[] | null {
  if (Array.isArray(rawPeriods)) return rawPeriods;
  if (!isRecord(rawPeriods)) return null;

  const candidate =
    rawPeriods.periods ??
    rawPeriods.periodList ??
    rawPeriods.perdioList ??
    rawPeriods.offlinePeriods ??
    rawPeriods;
  if (Array.isArray(candidate)) return candidate;
  return isRecord(candidate) ? (candidate as PeriodCandidate) : null;
}

function getDayStart(timestamp: number): number {
  const date = new Date(timestamp);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function getNextDayStart(dayStart: number): number {
  const date = new Date(dayStart);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime();
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

function isStoredPeriod(value: unknown): value is {
  start: number;
  end: number | null;
} {
  if (!isRecord(value)) return false;
  return (
    Number.isFinite(Number(value.start)) &&
    (value.end === null ||
      value.end === undefined ||
      Number.isFinite(Number(value.end)))
  );
}
