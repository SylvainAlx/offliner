import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CONTENT_SECURITY_POLICY } from "../../vite-plugins/offlinerServiceWorker.ts";

interface VercelConfig {
  buildCommand: string;
  headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
}

const config = JSON.parse(
  readFileSync(new URL("../../vercel.json", import.meta.url), "utf8"),
) as VercelConfig;

function headersFor(source: string): Record<string, string> {
  const rule = config.headers.find((entry) => entry.source === source);
  if (!rule) throw new Error(`No header rule for ${source}`);
  return Object.fromEntries(rule.headers.map(({ key, value }) => [key, value]));
}

describe("Vercel configuration", () => {
  it("runs the tests before building, so a failing test blocks the deployment", () => {
    expect(config.buildCommand).toBe("pnpm test && pnpm build");
  });

  it("sends the same Content-Security-Policy as the page, plus frame-ancestors", () => {
    const header = headersFor("/(.*)")["Content-Security-Policy"];
    const directives = header.split("; ");

    for (const directive of CONTENT_SECURITY_POLICY.split("; ")) {
      expect(directives).toContain(directive);
    }
    expect(directives).toContain("frame-ancestors 'none'");
  });

  it("never caches the service worker, but caches hashed build files forever", () => {
    expect(headersFor("/sw.js")["Cache-Control"]).toContain("max-age=0");
    expect(headersFor("/assets/(.*)")["Cache-Control"]).toContain("immutable");
  });
});
