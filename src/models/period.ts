import { OFFLINIUM_DELIVERY_INTERVAL } from "../utils/constants";

export class Period {
  start: number;
  end: number | null;
  private finalDuration: number | null;
  /** Unobserved time over the cap, not credited to the period. */
  private excludedMs: number;

  constructor(start: number, end: number | null = null, excludedMs = 0) {
    this.start = start;
    this.end = end;
    this.excludedMs = Math.max(0, excludedMs);
    this.finalDuration = end === null ? null : this.getPeriodDurationMs();
  }

  close(end: number): number {
    this.end = end;
    this.finalDuration = this.getPeriodDurationMs(end);
    return this.finalDuration;
  }

  getPeriodDurationMs(now?: number): number {
    if (this.finalDuration !== null) return this.finalDuration;
    const end = this.end ?? now ?? Date.now();
    return Math.max(0, end - this.start - this.excludedMs);
  }

  getOffliniumGain(now?: number): number {
    const duration = this.getPeriodDurationMs(now);
    return Math.floor(duration / OFFLINIUM_DELIVERY_INTERVAL);
  }
}
