import { create } from "zustand";
import { RELEASE_NOTES } from "../data/releaseNotes";
import {
  compareReleases,
  FIRST_VERSION,
  getUnseenNotes,
  isVersion,
  type ReleaseNote,
} from "../models/release";
import { getLocalStorage, type KeyValueStore } from "../services/storageProtection";
import { hasDismissedWelcome } from "../services/welcome";
import { OFFLINER_VERSION } from "../utils/constants";

/** Kept on the device, not in the game save: it is about what was shown here. */
export const LAST_SEEN_VERSION_KEY = "offliner:last-seen-version";

export interface ReleaseStore {
  /** The news still to be shown, newest first. */
  unseenNotes: ReleaseNote[];
  markSeen: () => void;
}

export interface ReleaseStoreOptions {
  store: KeyValueStore | undefined;
  currentVersion: string;
  notes: readonly ReleaseNote[];
}

function readLastSeen(store: KeyValueStore | undefined): string | null {
  try {
    const value = store?.getItem(LAST_SEEN_VERSION_KEY);
    return isVersion(value) ? value : null;
  } catch {
    return null;
  }
}

function writeLastSeen(store: KeyValueStore | undefined, version: string): void {
  try {
    store?.setItem(LAST_SEEN_VERSION_KEY, version);
  } catch {
    // Not kept: the news may show again.
  }
}

/**
 * Must be created before the player can leave the welcome page: that page is
 * what tells a new player, who has no news to read, from a returning one.
 */
export function createReleaseStore({ store, currentVersion, notes }: ReleaseStoreOptions) {
  const stored = readLastSeen(store);
  const lastSeen = stored ?? (hasDismissedWelcome(store) ? FIRST_VERSION : currentVersion);
  const unseenNotes = getUnseenNotes(notes, lastSeen, currentVersion);

  // With news to show, the version is only recorded once they are closed.
  // After a rollback, the newer version stays recorded.
  if (unseenNotes.length === 0 && compareReleases(currentVersion, lastSeen) >= 0) {
    writeLastSeen(store, currentVersion);
  }

  return create<ReleaseStore>((set) => ({
    unseenNotes,
    markSeen: () => {
      writeLastSeen(store, currentVersion);
      set({ unseenNotes: [] });
    },
  }));
}

export const useRelease = createReleaseStore({
  store: getLocalStorage(),
  currentVersion: OFFLINER_VERSION,
  notes: RELEASE_NOTES,
});
