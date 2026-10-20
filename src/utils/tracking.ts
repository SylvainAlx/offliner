import type { OfflineDay } from "../models/periodList";
import { formatMonth } from "./format";

export interface MonthSummary {
  key: string;
  label: string;
  days: OfflineDay[];
  totalDurationMs: number;
}

export function groupDaysByMonth(days: OfflineDay[]): MonthSummary[] {
  const groups: MonthSummary[] = [];
  const map = new Map<string, MonthSummary>();

  for (const day of days) {
    const date = new Date(day.dayStart);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    let group = map.get(key);
    if (!group) {
      group = {
        key,
        label: formatMonth(day.dayStart),
        days: [],
        totalDurationMs: 0,
      };
      map.set(key, group);
      groups.push(group);
    }

    group.days.push(day);
    group.totalDurationMs += day.durationMs;
  }

  return groups;
}
