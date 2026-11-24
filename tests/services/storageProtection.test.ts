import { describe, expect, it, vi } from "vitest";
import {
  getStorageProtection,
  requestStorageProtection,
  type KeyValueStore,
} from "../../src/services/storageProtection";
import { STORAGE_PROTECTION_RETRY_MS } from "../../src/utils/constants";

const NOW = Date.UTC(2026, 10, 24);

function memoryStore(): KeyValueStore {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
  };
}

function storage(options: { persisted: boolean; grant: boolean }) {
  let persisted = options.persisted;
  const persist = vi.fn(async () => {
    if (options.grant) persisted = true;
    return options.grant;
  });
  return { persisted: async () => persisted, persist };
}

describe("storage protection", () => {
  it("reports browsers without the Storage API", async () => {
    expect(await getStorageProtection(undefined)).toBe("unsupported");
    expect(await getStorageProtection({})).toBe("unsupported");
  });

  it("does not ask again once the data is protected", async () => {
    const api = storage({ persisted: true, grant: true });
    const result = await requestStorageProtection({ storage: api, store: memoryStore(), now: NOW });
    expect(result).toBe("protected");
    expect(api.persist).not.toHaveBeenCalled();
  });

  it("asks the browser and reports its answer", async () => {
    const api = storage({ persisted: false, grant: true });
    const result = await requestStorageProtection({ storage: api, store: memoryStore(), now: NOW });
    expect(result).toBe("protected");
    expect(api.persist).toHaveBeenCalledOnce();
  });

  it("waits before asking again after a refusal, unless the player asks", async () => {
    const api = storage({ persisted: false, grant: false });
    const store = memoryStore();

    expect(await requestStorageProtection({ storage: api, store, now: NOW })).toBe("unprotected");
    await requestStorageProtection({ storage: api, store, now: NOW + 60_000 });
    expect(api.persist).toHaveBeenCalledTimes(1);

    await requestStorageProtection({ storage: api, store, now: NOW + 60_000, force: true });
    expect(api.persist).toHaveBeenCalledTimes(2);

    await requestStorageProtection({
      storage: api,
      store,
      now: NOW + 60_000 + STORAGE_PROTECTION_RETRY_MS,
    });
    expect(api.persist).toHaveBeenCalledTimes(3);
  });

  it("treats a failing browser as unprotected", async () => {
    const api = {
      persisted: async () => false,
      persist: async () => {
        throw new Error("denied");
      },
    };
    expect(await requestStorageProtection({ storage: api, store: memoryStore(), now: NOW })).toBe(
      "unprotected",
    );
  });
});
