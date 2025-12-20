import { supabase } from "@/utils/supabase";

export interface Team {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  invite_code: string | null;
  is_private: boolean;
  created_at: string;
}

export async function getTeams() {
  const { data, error } = await supabase.from("teams").select("*");
  if (error) throw error;
  return data;
}

export async function getTeam(TeamId: string) {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("id", TeamId)
    .single();
  if (error) throw error;
  return data as Team;
}

export async function createTeam(
  teamName: string,
  teamDescription: string,
  teamIsPrivate: boolean,
): Promise<string> {
  const { data: teamId, error } = await supabase.rpc("create_team", {
    p_name: teamName,
    p_description: teamDescription,
    p_is_private: teamIsPrivate,
  });

  if (error) {
    throw new Error(error.message);
  }

  return teamId;
}

export async function joinTeamByInviteCode(inviteCode: string): Promise<void> {
  const { error } = await supabase.rpc("join_team_by_invite_code", {
    p_invite_code: inviteCode,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function leaveTeam(): Promise<void> {
  const { error } = await supabase.rpc("leave_team");

  if (error) {
    throw new Error(error.message);
  }
}

export async function transferTeamOwnership(newOwnerId: string): Promise<void> {
  const { error } = await supabase.rpc("transfer_team_ownership", {
    p_new_owner_id: newOwnerId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteTeam(): Promise<void> {
  const { error } = await supabase.rpc("delete_team");

  if (error) {
    throw new Error(error.message);
  }
}

export async function getTeamMembers(teamId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("id, username, country")
    .eq("team_id", teamId);

  if (error) {
    console.error("Error fetching team members:", error);
    return [];
  }
  return data;
}
