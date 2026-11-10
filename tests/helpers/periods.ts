import type { PeriodList } from "../../src/models/periodList";
import { MINUTE } from "./time";

/**
 * Opens a period at `start` and records the app's regular observations until
 * `end`, as when the app stays open offline. The caller closes it, or not.
 */
export function observeOffline(
  list: PeriodList,
  start: number,
  end: number,
  stepMs = 5 * MINUTE,
): void {
  list.openPeriodIfNeeded(start);
  for (let time = start + stepMs; time < end; time += stepMs) {
    list.recordObservation(time);
  }
}
