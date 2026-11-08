import { readFileSync } from "node:fs";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { beforeEach, describe, expect, it } from "vitest";
import {
  CONTENT_SECURITY_POLICY,
  SW_PRECACHE_PLACEHOLDER,
  SW_VERSION_PLACEHOLDER,
  offlinerServiceWorker,
} from "../../vite-plugins/offlinerServiceWorker.ts";

const ORIGIN = "https://offliner.test";
const SOURCE = readFileSync(new URL("../../public/sw.js", import.meta.url), "utf8");

type Listener = (event: FakeEvent) => void;
interface FakeEvent {
  request?: { method: string; url: string; mode: string };
  waitUntil?: (promise: Promise<unknown>) => void;
  respondWith?: (promise: Promise<Response>) => void;
}

/** Runs public/sw.js against in-memory Cache Storage and a scriptable network. */
function createWorker(precache: string[] = ["./assets/app-1.js"]) {
  const stores = new Map<string, Map<string, Response>>();
  const listeners: Record<string, Listener> = {};
  const network = { mode: "online" as "online" | "offline" | "error", requests: 0 };

  const key = (request: string | { url: string }) =>
    new URL(typeof request === "string" ? request : request.url, `${ORIGIN}/`).href;
  const openCache = (name: string) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const entries = stores.get(name)!;
    return {
      addAll: async (urls: string[]) => {
        for (const url of urls) entries.set(key(url), new Response(`precached ${url}`));
      },
      put: async (request: string | { url: string }, response: Response) => {
        entries.set(key(request), response);
      },
      match: async (request: string | { url: string }) => entries.get(key(request))?.clone(),
    };
  };

  const context = {
    URL,
    Response,
    AbortController,
    setTimeout,
    clearTimeout,
    caches: {
      open: async (name: string) => openCache(name),
      keys: async () => [...stores.keys()],
      delete: async (name: string) => stores.delete(name),
      match: async (request: { url: string }) => {
        for (const name of stores.keys()) {
          const found = await openCache(name).match(request);
          if (found) return found;
        }
        return undefined;
      },
    },
    fetch: async (request: { url: string }) => {
      network.requests += 1;
      if (network.mode === "offline") throw new TypeError("Failed to fetch");
      const response = new Response(network.mode === "error" ? "error" : `network ${request.url}`, {
        status: network.mode === "error" ? 500 : 200,
      });
      Object.defineProperty(response, "type", { value: "basic" });
      return response;
    },
    self: {
      location: { origin: ORIGIN },
      addEventListener: (type: string, listener: Listener) => {
        listeners[type] = listener;
      },
      skipWaiting: async () => undefined,
      clients: { claim: async () => undefined },
    },
  };

  const source = SOURCE.replace(SW_VERSION_PLACEHOLDER, JSON.stringify("v2")).replace(
    SW_PRECACHE_PLACEHOLDER,
    JSON.stringify(precache),
  );
  runInNewContext(source, context);

  const dispatch = (type: string, event: FakeEvent = {}) =>
    new Promise<Response | undefined>((resolve, reject) => {
      let handled = false;
      event.waitUntil = (promise) => {
        handled = true;
        promise.then(() => resolve(undefined), reject);
      };
      event.respondWith = (promise) => {
        handled = true;
        promise.then(resolve, reject);
      };
      listeners[type](event);
      if (!handled) resolve(undefined);
    });

  const get = (path: string, mode = "no-cors", method = "GET") =>
    dispatch("fetch", { request: { method, url: new URL(path, ORIGIN).href, mode } });

  return { stores, network, dispatch, get, navigate: (path: string) => get(path, "navigate") };
}

describe("service worker", () => {
  let worker: ReturnType<typeof createWorker>;

  beforeEach(async () => {
    worker = createWorker();
    worker.stores.set("offliner-v1", new Map());
    worker.stores.set("another-app", new Map());
    await worker.dispatch("install");
    await worker.dispatch("activate");
  });

  it("precaches the shell and the build files, and removes old Offliner caches only", () => {
    expect([...worker.stores.keys()].sort()).toEqual(["another-app", "offliner-v2"]);
    expect([...worker.stores.get("offliner-v2")!.keys()]).toEqual(
      expect.arrayContaining([
        `${ORIGIN}/`,
        `${ORIGIN}/index.html`,
        `${ORIGIN}/manifest.webmanifest`,
        `${ORIGIN}/assets/app-1.js`,
      ]),
    );
  });

  it("serves pages from the network when it is available", async () => {
    const response = await worker.navigate("/");
    expect(await response!.text()).toBe(`network ${ORIGIN}/`);
  });

  it("falls back to the last good page when offline", async () => {
    await worker.navigate("/");
    worker.network.mode = "offline";

    const response = await worker.navigate("/?source=pwa");
    expect(await response!.text()).toBe(`network ${ORIGIN}/`);
  });

  it("never keeps an error page as the offline page", async () => {
    worker.network.mode = "error";
    expect((await worker.navigate("/"))!.status).toBe(500);

    worker.network.mode = "offline";
    expect(await (await worker.navigate("/"))!.text()).toBe("precached ./index.html");
  });

  it("serves build files from the cache without the network", async () => {
    worker.network.mode = "offline";
    const response = await worker.get("/assets/app-1.js");
    expect(await response!.text()).toBe("precached ./assets/app-1.js");
    expect(worker.network.requests).toBe(0);
  });

  it("caches other same-origin files after the first request", async () => {
    await worker.get("/assets/late.png");
    worker.network.mode = "offline";
    expect(await (await worker.get("/assets/late.png"))!.text()).toBe(`network ${ORIGIN}/assets/late.png`);
  });

  it("leaves other origins and non-GET requests to the browser", async () => {
    expect(await worker.get("https://example.com/x.js")).toBeUndefined();
    expect(await worker.get("/api", "cors", "POST")).toBeUndefined();
    expect(worker.network.requests).toBe(0);
  });
});

describe("offlinerServiceWorker build plugin", () => {
  it("injects the Content-Security-Policy", () => {
    const plugin = offlinerServiceWorker();
    const transform = plugin.transformIndexHtml as unknown as () => Array<{ attrs: Record<string, string> }>;
    expect(transform()[0].attrs).toEqual({
      "http-equiv": "Content-Security-Policy",
      content: CONTENT_SECURITY_POLICY,
    });
  });

  it("writes the build version and the generated files into sw.js", async () => {
    const outDir = await mkdtemp(join(tmpdir(), "offliner-sw-"));
    await writeFile(join(outDir, "sw.js"), SOURCE);

    const build = async (code: string) => {
      const plugin = offlinerServiceWorker() as unknown as Record<string, (...args: unknown[]) => unknown>;
      plugin.configResolved({ root: "/", build: { outDir } });
      plugin.generateBundle({}, {
        "index.html": { type: "asset", source: "<html></html>" },
        "assets/index-a1.js": { type: "chunk", code },
        "assets/index-a1.js.map": { type: "asset", source: "{}" },
        "assets/index-b2.css": { type: "asset", source: "body{}" },
      });
      await plugin.closeBundle();
      const output = await readFile(join(outDir, "sw.js"), "utf8");
      await writeFile(join(outDir, "sw.js"), SOURCE);
      return output;
    };

    const first = await build("console.log(1)");
    const second = await build("console.log(2)");
    const version = (source: string) => /const BUILD_VERSION = "([0-9a-f]{16})";/.exec(source)?.[1];

    expect(first).toContain('const PRECACHE_ASSETS = ["./assets/index-a1.js","./assets/index-b2.css"];');
    expect(version(first)).toBeDefined();
    expect(version(second)).toBeDefined();
    expect(version(first)).not.toBe(version(second));
  });

  it("fails the build when sw.js lost its placeholders", async () => {
    const outDir = await mkdtemp(join(tmpdir(), "offliner-sw-"));
    await writeFile(join(outDir, "sw.js"), "self.addEventListener('fetch', () => {});");
    const plugin = offlinerServiceWorker() as unknown as Record<string, (...args: unknown[]) => unknown>;
    plugin.configResolved({ root: "/", build: { outDir } });
    plugin.generateBundle({}, {});
    await expect(plugin.closeBundle()).rejects.toThrow("placeholders");
  });
});
