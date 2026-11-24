import { db } from "./database";
import { SAVE_VERSION, User } from "../models/user";

function serializeUser(user: User): Record<string, unknown> {
  return JSON.parse(JSON.stringify(user)) as Record<string, unknown>;
}

export const userRepository = {
  async load(): Promise<User> {
    const stored = await db.profiles.get("current");
    const user = new User();

    // A save of another version starts a new game.
    if (stored?.schemaVersion === SAVE_VERSION) user.loadFromSnapshot(stored.data);

    return user;
  },

  async save(user: User): Promise<void> {
    await db.profiles.put({
      id: "current",
      schemaVersion: SAVE_VERSION,
      updatedAt: Date.now(),
      data: serializeUser(user),
    });
  },

  /** The save of a game in memory, read at once (sharing needs the tap's activation). */
  snapshot(user: User): Record<string, unknown> {
    return serializeUser(user);
  },

  async exportSnapshot(): Promise<unknown | null> {
    const stored = await db.profiles.get("current");
    return stored?.data ?? null;
  },
};
