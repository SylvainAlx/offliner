import { BACKUP_REMINDER_MS } from "../utils/constants";

export interface BackupReminderState {
  /** When the player last exported or imported a save, if ever on this device. */
  lastBackupAt: number | null;
  /** When the game began: a game never saved is due a week after its start. */
  createdAt: number;
  /** Until when the player asked not to be reminded. */
  snoozedUntil: number | null;
}

/** When a backup becomes advisable. */
export function getBackupDueAt(state: Pick<BackupReminderState, "lastBackupAt" | "createdAt">): number {
  return (state.lastBackupAt ?? state.createdAt) + BACKUP_REMINDER_MS;
}

/** Whether the player should be reminded to back up their game now. */
export function isBackupReminderDue(state: BackupReminderState, now: number): boolean {
  return now >= getBackupDueAt(state) && now >= (state.snoozedUntil ?? 0);
}
