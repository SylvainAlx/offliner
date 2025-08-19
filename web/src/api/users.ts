import { supabase } from "src/lib/supabase";

export async function getUser(username: string | undefined) {
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  if (error) {
    console.error("Erreur Supabase :", error);
  }

  return user;
}

export async function getRanking(
  scope: { column: string; value: string | null },
  username: string | undefined,
) {
  if (!scope.value) return null;

  const { data: users, error } = await supabase
    .from("users")
    .select("username, total_duration")
    .eq(scope.column, scope.value)
    .order("total_duration", { ascending: false });

  if (error || !users) {
    console.error(error);
    return null;
  }

  const rank = users.findIndex((u) => u.username === username) + 1;
  return { rank, total: users.length };
}

export async function getUsersRanking() {
  const { data, error } = await supabase
    .from("users")
    .select("username, total_duration, country, region, subregion")
    .order("total_duration", { ascending: false });

  if (error) {
    console.error("Erreur Supabase :", error);
    return;
  }

  return data;
}
