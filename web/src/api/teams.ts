import { supabase } from "src/lib/supabase";

export interface Team {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  invite_code: string | null;
  is_private: boolean;
  created_at: string;
}

export interface TeamMember {
  id: string;
  username: string;
  country: string | null;
  total_duration: number;
}

export async function getTeam(teamId: string): Promise<Team | null> {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching team:", error);
    return null;
  }
  return data;
}

export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from("users")
    .select("id, username, country, total_duration")
    .eq("team_id", teamId)
    .order("total_duration", { ascending: false });

  if (error) {
    console.error("Error fetching team members:", error);
    return [];
  }
  return data || [];
}

export async function getTeamRanking(teamId: string) {
  // This is a simplified version. A real team ranking might involve a separate view or more complex query.
  // For now, let's just imagine we sum member durations.
  const { data: teams, error } = await supabase.from("teams").select(`
      id,
      name,
      users!users_team_id_fkey (
        total_duration
      )
    `);

  if (error || !teams) {
    console.error("Error fetching team ranking:", error);
    return null;
  }

  const teamStats = teams
    .map((t) => ({
      id: t.id,
      name: t.name,
      total_duration: (t.users as any[]).reduce(
        (acc, u) => acc + (u.total_duration || 0),
        0,
      ),
    }))
    .sort((a, b) => b.total_duration - a.total_duration);

  const rank = teamStats.findIndex((t) => t.id === teamId) + 1;
  return { rank, total: teamStats.length };
}

export async function getTopTeamsRanking() {
  const { data: teams, error } = await supabase.from("teams").select(`
      id,
      name,
      is_private,
      invite_code,
      users!users_team_id_fkey (
        total_duration
      )
    `);

  if (error || !teams) {
    console.error("Error fetching top teams ranking:", error);
    return [];
  }

  const teamStats = teams
    .map((t) => ({
      id: t.id,
      name: t.name,
      member_count: (t.users as any[]).length,
      invite_code: !t.is_private ? t.invite_code : "équipe privée",
      total_duration: (t.users as any[]).reduce(
        (acc, u) => acc + (u.total_duration || 0),
        0,
      ),
    }))
    .sort((a, b) => b.total_duration - a.total_duration)
    .slice(0, 100);

  return teamStats;
}
