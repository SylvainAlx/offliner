import { describe, expect, it } from "vitest";
import { getBackupDueAt, isBackupReminderDue } from "../../src/models/backup";
import { BACKUP_REMINDER_MS } from "../../src/utils/constants";

const DAY = 24 * 60 * 60 * 1000;
const START = Date.UTC(2026, 10, 1);

describe("backup reminder", () => {
  it("waits a week after the game's start when no backup was ever made", () => {
    const state = { lastBackupAt: null, createdAt: START, snoozedUntil: null };
    expect(getBackupDueAt(state)).toBe(START + BACKUP_REMINDER_MS);
    expect(isBackupReminderDue(state, START + 6 * DAY)).toBe(false);
    expect(isBackupReminderDue(state, START + 7 * DAY)).toBe(true);
  });

  it("counts from the last backup", () => {
    const state = { lastBackupAt: START + 10 * DAY, createdAt: START, snoozedUntil: null };
    expect(isBackupReminderDue(state, START + 16 * DAY)).toBe(false);
    expect(isBackupReminderDue(state, START + 17 * DAY)).toBe(true);
  });

  it("stays hidden while snoozed", () => {
    const state = { lastBackupAt: null, createdAt: START, snoozedUntil: START + 10 * DAY };
    expect(isBackupReminderDue(state, START + 9 * DAY)).toBe(false);
    expect(isBackupReminderDue(state, START + 10 * DAY)).toBe(true);
  });
});
