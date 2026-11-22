import type { User } from "../../src/models/user";
import type { Resources } from "../../src/models/resources";

/** Sets the starting planet's metal and food, and the player's Offlinium. */
export function setBalance(user: User, balance: Resources): void {
  user.homeColony.resources = { metal: balance.metal, food: balance.food };
  user.offlinium = balance.offlinium;
}
