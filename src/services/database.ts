import Dexie, { type Table } from "dexie";

export interface StoredProfile {
  id: "current";
  schemaVersion: 1;
  updatedAt: number;
  data: unknown;
}

/** The database of the planet game (v1). */
const DATABASE_NAME = "offliner-v1";
/** The village game's database, abandoned with v1: deleted on first launch. */
const LEGACY_DATABASE_NAME = "offliner";

class OfflinerDatabase extends Dexie {
  profiles!: Table<StoredProfile, string>;

  constructor() {
    super(DATABASE_NAME);
    this.version(1).stores({ profiles: "id" });
  }
}

export const db = new OfflinerDatabase();

/** Removes the saves of the village game, if any. Never blocks the start. */
export async function deleteLegacyDatabase(): Promise<void> {
  try {
    if (await Dexie.exists(LEGACY_DATABASE_NAME)) {
      await Dexie.delete(LEGACY_DATABASE_NAME);
    }
  } catch (error) {
    console.warn("Unable to delete the previous Offliner data:", error);
  }
}
