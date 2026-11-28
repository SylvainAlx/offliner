import type { ReleaseNote } from "../models/release";

/**
 * What players are told after an update: one entry per minor or major version
 * (x.y.0). Patches have none. 1.0.0 is the starting point, so it has none
 * either. A test fails when the current version lacks its entry.
 *
 * Example:
 * {
 *   version: "1.1.0",
 *   date: "2027-01-15",
 *   title: "Titre court de la version",
 *   changes: ["Une nouveauté, décrite pour le joueur."],
 * }
 */
export const RELEASE_NOTES: readonly ReleaseNote[] = [];
