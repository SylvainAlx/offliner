export type TeamMember = {
  id: string;
  username: string | null;
  country: string | null;
};

export class Team {
  constructor(
    public id: string = "",
    public name: string = "",
    public description: string | null = null,
    public owner_id: string = "",
    public invite_code: string | null = null,
    public is_private: boolean = false,
    public created_at: string = "",
    public members: TeamMember[] = [],
  ) {}

  /**
   * Creates a clone of the team with optional updates.
   */
  update(updates: Partial<Team>): Team {
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined),
    );
    return Object.assign(new Team(), this, filteredUpdates);
  }
}
