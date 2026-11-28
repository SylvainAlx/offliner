/** The news of a minor or major version, as told to players. */
export interface ReleaseNote {
  /** "x.y.0" */
  version: string;
  /** "YYYY-MM-DD" */
  date: string;
  title: string;
  changes: string[];
}

/** The version players already had before the app remembered what they saw. */
export const FIRST_VERSION = "1.0.0";

const VERSION_PATTERN = /^(\d+)\.(\d+)\.(\d+)$/;

export function isVersion(value: unknown): value is string {
  return typeof value === "string" && VERSION_PATTERN.test(value);
}

/** Orders two versions by major, then minor: patches do not count. */
export function compareReleases(a: string, b: string): number {
  const [aMajor, aMinor] = a.split(".").map(Number);
  const [bMajor, bMinor] = b.split(".").map(Number);
  return aMajor - bMajor || aMinor - bMinor;
}

/**
 * The notes of the minor and major versions reached since `lastSeen`, up to
 * `current`, newest first.
 */
export function getUnseenNotes(
  notes: readonly ReleaseNote[],
  lastSeen: string,
  current: string,
): ReleaseNote[] {
  return notes
    .filter(
      (note) =>
        compareReleases(note.version, lastSeen) > 0 &&
        compareReleases(note.version, current) <= 0,
    )
    .sort((a, b) => compareReleases(b.version, a.version));
}
