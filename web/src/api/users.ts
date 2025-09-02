import { supabase } from "src/lib/supabase";

export async function getUser(username: string | undefined) {
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (error) {
    console.error("Erreur Supabase :", error);
  }

  return user;
}

export async function getRanking(
  scope: { column: string; value: string | null } | null,
  username: string | undefined,
) {
  if (!username) return null;

  // Construction de la requête
  let query = supabase
    .from("users")
    .select("username, total_duration")
    .order("total_duration", { ascending: false });

  // Si scope défini et valeur présente, on filtre
  if (scope?.value) {
    query = query.eq(scope.column, scope.value);
  }

  const { data: users, error } = await query;

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
    .not("total_duration", "is", null)
    .order("total_duration", { ascending: false });

  if (error) {
    console.error("Erreur Supabase :", error);
    return;
  }

  return data;
}

export async function getTotalDuration(): Promise<number> {
  const { data, error } = await supabase.from("users").select("total_duration");

  if (error) {
    console.error("Erreur Supabase :", error);
    return 0;
  }

  if (!data) return 0;

  // somme côté JS
  return data.reduce((acc, row) => acc + (row.total_duration ?? 0), 0);
}
