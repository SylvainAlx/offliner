import { db } from "./database";
import { User } from "../models/user";

function serializeUser(user: User): Record<string, unknown> {
  return JSON.parse(JSON.stringify(user)) as Record<string, unknown>;
}

export const userRepository = {
  async load(): Promise<User> {
    const stored = await db.profiles.get("current");
    const user = new User();

    if (stored) user.loadFromSnapshot(stored.data);

    return user;
  },

  async save(user: User): Promise<void> {
    await db.profiles.put({
      id: "current",
      schemaVersion: 1,
      updatedAt: Date.now(),
      data: serializeUser(user),
    });
  },

  async exportSnapshot(): Promise<unknown | null> {
    const stored = await db.profiles.get("current");
    return stored?.data ?? null;
  },
};
