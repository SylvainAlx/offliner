import { describe, expect, it } from "vitest";
import type { ReleaseNote } from "../../src/models/release";
import type { KeyValueStore } from "../../src/services/storageProtection";
import { rememberWelcomeDismissed } from "../../src/services/welcome";
import { createReleaseStore, LAST_SEEN_VERSION_KEY } from "../../src/stores/releaseStore";

const NOTES: ReleaseNote[] = [
  { version: "1.1.0", date: "2027-01-01", title: "1.1", changes: ["Nouveauté"] },
];

function memoryStore({ returning = false, lastSeen = "" } = {}): KeyValueStore {
  const values = new Map<string, string>();
  const store: KeyValueStore = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
  };
  if (returning) rememberWelcomeDismissed(store);
  if (lastSeen) store.setItem(LAST_SEEN_VERSION_KEY, lastSeen);
  return store;
}

const open = (store: KeyValueStore | undefined, currentVersion = "1.1.0") =>
  createReleaseStore({ store, currentVersion, notes: NOTES }).getState();

describe("releaseStore", () => {
  it("shows nothing to a new player, even after they have started playing", () => {
    const store = memoryStore();
    expect(open(store).unseenNotes).toEqual([]);
    rememberWelcomeDismissed(store);
    expect(open(store).unseenNotes).toEqual([]);
  });

  it("takes a returning player without a recorded version as coming from 1.0.0", () => {
    expect(open(memoryStore({ returning: true })).unseenNotes).toEqual(NOTES);
  });

  it("shows the news again until they are closed", () => {
    const store = memoryStore({ lastSeen: "1.0.0" });
    expect(open(store).unseenNotes).toEqual(NOTES);

    const useRelease = createReleaseStore({ store, currentVersion: "1.1.0", notes: NOTES });
    useRelease.getState().markSeen();

    expect(useRelease.getState().unseenNotes).toEqual([]);
    expect(open(store).unseenNotes).toEqual([]);
  });

  it("records a patch without showing anything", () => {
    const store = memoryStore({ lastSeen: "1.1.0" });
    expect(open(store, "1.1.1").unseenNotes).toEqual([]);
    expect(store.getItem(LAST_SEEN_VERSION_KEY)).toBe("1.1.1");
  });

  it("keeps the newer version recorded after a rollback", () => {
    const store = memoryStore({ lastSeen: "1.1.0" });
    expect(open(store, "1.0.0").unseenNotes).toEqual([]);
    expect(store.getItem(LAST_SEEN_VERSION_KEY)).toBe("1.1.0");
  });

  it("works when storage is blocked or missing", () => {
    const blocked = () => {
      throw new Error("blocked");
    };
    expect(() => open({ getItem: blocked, setItem: blocked }).markSeen()).not.toThrow();
    expect(open(undefined).unseenNotes).toEqual([]);
  });
});
