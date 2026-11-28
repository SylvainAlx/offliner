import { describe, expect, it } from "vitest";
import { RELEASE_NOTES } from "../../src/data/releaseNotes";
import {
  compareReleases,
  FIRST_VERSION,
  getUnseenNotes,
  isVersion,
  type ReleaseNote,
} from "../../src/models/release";
import { OFFLINER_VERSION } from "../../src/utils/constants";

const note = (version: string): ReleaseNote => ({
  version,
  date: "2027-01-01",
  title: version,
  changes: ["Nouveauté"],
});

const NOTES = [note("1.1.0"), note("2.0.0"), note("1.2.0")];
const versions = (lastSeen: string, current: string) =>
  getUnseenNotes(NOTES, lastSeen, current).map((item) => item.version);

describe("getUnseenNotes", () => {
  it("gives every note missed, newest first", () => {
    expect(versions("1.0.0", "2.0.0")).toEqual(["2.0.0", "1.2.0", "1.1.0"]);
  });

  it("ignores patches", () => {
    expect(versions("1.1.0", "1.1.3")).toEqual([]);
    expect(versions("1.1.3", "1.2.1")).toEqual(["1.2.0"]);
  });

  it("keeps the news of a minor version first opened at one of its patches", () => {
    expect(versions("1.0.0", "1.1.2")).toEqual(["1.1.0"]);
  });

  it("gives nothing for a later version or after a rollback", () => {
    expect(versions("1.0.0", "1.0.0")).toEqual([]);
    expect(versions("2.0.0", "1.1.0")).toEqual([]);
  });

  it("compares numbers, not text", () => {
    expect(compareReleases("1.10.0", "1.9.0")).toBeGreaterThan(0);
  });
});

describe("release notes", () => {
  it("has an entry for the current minor or major version", () => {
    if (compareReleases(OFFLINER_VERSION, FIRST_VERSION) <= 0) return;
    expect(
      RELEASE_NOTES.some((item) => compareReleases(item.version, OFFLINER_VERSION) === 0),
      `Add the notes of ${OFFLINER_VERSION} to src/data/releaseNotes.ts`,
    ).toBe(true);
  });

  it("has well-formed entries, one per minor or major version", () => {
    expect(isVersion(OFFLINER_VERSION)).toBe(true);
    expect(new Set(RELEASE_NOTES.map((item) => item.version)).size).toBe(RELEASE_NOTES.length);
    for (const item of RELEASE_NOTES) {
      expect(isVersion(item.version) && item.version.endsWith(".0")).toBe(true);
      expect(item.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(item.title).not.toBe("");
      expect(item.changes.length).toBeGreaterThan(0);
    }
  });
});
