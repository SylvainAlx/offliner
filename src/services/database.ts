import Dexie, { type Table } from "dexie";

export interface StoredProfile {
  id: "current";
  /** SAVE_VERSION of the data; another version is not loaded. */
  schemaVersion: number;
  updatedAt: number;
  data: unknown;
}

/** The database of the planet game. */
const DATABASE_NAME = "offliner-v1";

class OfflinerDatabase extends Dexie {
  profiles!: Table<StoredProfile, string>;

  constructor() {
    super(DATABASE_NAME);
    this.version(1).stores({ profiles: "id" });
  }
}

export const db = new OfflinerDatabase();
