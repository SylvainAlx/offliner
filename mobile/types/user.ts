import { Team } from "./team";

export class OfflinerUser {
  constructor(
    public id: string = "",
    public username: string | null = null,
    public country: string | null = null,
    public region: string | null = null,
    public subregion: string | null = null,
    public gemBalance: number = 0,
    public dailyGoalSeconds: number | null = null,
    public totalSyncSeconds: number = 0,
    public weeklySyncSeconds: number = 0,
    public dailySyncSeconds: number = 0,
    public team_id: string | null = null,
    public team: Team | null = null,
    public deviceName: string | null = null,
  ) {}

  /**
   * Creates a clone of the user with optional updates.
   * Useful for React state updates to ensure immutability.
   */
  update(updates: Partial<OfflinerUser>): OfflinerUser {
    // Filter out undefined values to prevent them from overwriting defaults
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined),
    );
    return Object.assign(new OfflinerUser(), this, filteredUpdates);
  }

  /**
   * Helper to check if the user has a full profile set.
   */
  hasCompleteProfile(): boolean {
    return !!(this.username && this.country && this.region);
  }

  get isTeamOwner(): boolean {
    return this.id === this.team?.owner_id;
  }
}
