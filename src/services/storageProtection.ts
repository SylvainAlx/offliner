import { STORAGE_PROTECTION_RETRY_MS } from "../utils/constants";

/**
 * Whether the browser keeps the game's data when the device runs short of
 * space. Persistent storage is granted by the browser: most decide alone from
 * how the site is used (installed app, visits), Firefox asks the player.
 */
export type StorageProtection = "protected" | "unprotected" | "unsupported";

/** The parts of the Storage API (navigator.storage) the game uses. */
export interface PersistentStorage {
  persisted?: () => Promise<boolean>;
  persist?: () => Promise<boolean>;
}

/** Where the time of the last request is kept between visits. */
export interface KeyValueStore {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

const REQUESTED_AT_KEY = "offliner:storage-protection-requested-at";

export function getPersistentStorage(): PersistentStorage | undefined {
  return typeof navigator === "undefined" ? undefined : navigator.storage;
}

export async function getStorageProtection(
  storage: PersistentStorage | undefined = getPersistentStorage(),
): Promise<StorageProtection> {
  if (!storage?.persisted || !storage.persist) return "unsupported";
  try {
    return (await storage.persisted()) ? "protected" : "unprotected";
  } catch {
    return "unprotected";
  }
}

function readRequestedAt(store: KeyValueStore | undefined): number | null {
  try {
    const value = Number(store?.getItem(REQUESTED_AT_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function writeRequestedAt(store: KeyValueStore | undefined, now: number): void {
  try {
    store?.setItem(REQUESTED_AT_KEY, String(now));
  } catch {
    // Not kept: the next request simply comes sooner.
  }
}

export interface ProtectionRequest {
  storage?: PersistentStorage;
  store?: KeyValueStore;
  now: number;
  /** Asks even if a request was refused recently (the player pressed the button). */
  force?: boolean;
}

/**
 * Asks the browser to keep the game's data. A refused request is not repeated
 * for a while: Firefox would show its prompt again at every construction.
 */
export async function requestStorageProtection({
  storage = getPersistentStorage(),
  store = getLocalStorage(),
  now,
  force = false,
}: ProtectionRequest): Promise<StorageProtection> {
  const current = await getStorageProtection(storage);
  if (current !== "unprotected") return current;

  const requestedAt = readRequestedAt(store);
  if (!force && requestedAt !== null && now - requestedAt < STORAGE_PROTECTION_RETRY_MS) {
    return current;
  }

  writeRequestedAt(store, now);
  try {
    return (await storage!.persist!()) ? "protected" : "unprotected";
  } catch {
    return "unprotected";
  }
}

export function getLocalStorage(): KeyValueStore | undefined {
  try {
    return typeof localStorage === "undefined" ? undefined : localStorage;
  } catch {
    return undefined;
  }
}
