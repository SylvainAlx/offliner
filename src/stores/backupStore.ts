import { create } from "zustand";
import { BACKUP_SNOOZE_MS } from "../utils/constants";
import {
  getLocalStorage,
  requestStorageProtection,
  getStorageProtection,
  type KeyValueStore,
  type StorageProtection,
} from "../services/storageProtection";

const LAST_BACKUP_KEY = "offliner:last-backup-at";
const SNOOZED_UNTIL_KEY = "offliner:backup-reminder-snoozed-until";

function readTime(store: KeyValueStore | undefined, key: string): number | null {
  try {
    const value = Number(store?.getItem(key));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function writeTime(store: KeyValueStore | undefined, key: string, value: number | null): void {
  try {
    store?.setItem(key, value === null ? "" : String(value));
  } catch {
    // Not kept: the reminder may come back sooner than expected.
  }
}

export interface BackupStore {
  /** Unknown until the browser has answered. */
  protection: StorageProtection | null;
  lastBackupAt: number | null;
  snoozedUntil: number | null;
  refreshProtection: () => Promise<StorageProtection>;
  /** Asks the browser to keep the data; `force` ignores a recent refusal. */
  requestProtection: (force?: boolean) => Promise<StorageProtection>;
  markBackedUp: (now: number) => void;
  snoozeReminder: (now: number) => void;
  /** Forgets the backup history (the account was erased). */
  clearBackupHistory: () => void;
}

// One request at a time: a construction and the app's start can ask together.
let pendingRequest: Promise<StorageProtection> | null = null;

export const useBackup = create<BackupStore>((set) => {
  const store = getLocalStorage();
  return {
    protection: null,
    lastBackupAt: readTime(store, LAST_BACKUP_KEY),
    snoozedUntil: readTime(store, SNOOZED_UNTIL_KEY),

    refreshProtection: async () => {
      const protection = await getStorageProtection();
      set({ protection });
      return protection;
    },

    requestProtection: async (force = false) => {
      pendingRequest ??= requestStorageProtection({ now: Date.now(), force }).finally(() => {
        pendingRequest = null;
      });
      const protection = await pendingRequest;
      set({ protection });
      return protection;
    },

    markBackedUp: (now) => {
      writeTime(store, LAST_BACKUP_KEY, now);
      writeTime(store, SNOOZED_UNTIL_KEY, null);
      set({ lastBackupAt: now, snoozedUntil: null });
    },

    snoozeReminder: (now) => {
      const snoozedUntil = now + BACKUP_SNOOZE_MS;
      writeTime(store, SNOOZED_UNTIL_KEY, snoozedUntil);
      set({ snoozedUntil });
    },

    clearBackupHistory: () => {
      writeTime(store, LAST_BACKUP_KEY, null);
      writeTime(store, SNOOZED_UNTIL_KEY, null);
      set({ lastBackupAt: null, snoozedUntil: null });
    },
  };
});
