import { supabase } from "src/lib/supabase";

export type User = {
  id: string;
  username: string;
  total_duration: number;
  country: string | null;
  region: string | null;
  subregion: string | null;
  team_id: string | null;
  created_at: Date;
};

export async function getUser(username: string | undefined): Promise<User> {
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
    .select("username, total_duration, team_id")
    .not("total_duration", "is", null)
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
    .select(
      "username, total_duration, country, region, subregion, team_id, teams!users_team_id_fkey(name)",
    )
    .not("total_duration", "is", null)
    .order("total_duration", { ascending: false })
    .limit(100); // 👉 top 100

  if (error) {
    console.error("Erreur Supabase :", error);
    return;
  }

  // Supabase retourne teams comme un tableau [ { name: ... } ] à cause de la jointure
  // On l'aplatit pour le composant
  return (data || []).map((u: any) => ({
    ...u,
    teams: Array.isArray(u.teams) ? u.teams[0] : u.teams,
  }));
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

export async function getWeeklyLeagueRanking() {
  try {
    const { getCurrentWeekRange } = await import("shared/utils/dateUtils");
    const { start, end } = getCurrentWeekRange();

    // Récupérer toutes les mesures de la semaine avec les informations utilisateur
    const { data, error } = await supabase
      .from("measures")
      .select(
        `
        duration,
        user_id,
        users!inner (
          username,
          country,
          region,
          subregion,
          team_id,
          teams!users_team_id_fkey(name)
        )
      `,
      )
      .gte("date", start)
      .lte("date", end);

    if (error) {
      console.error(
        "Erreur lors de la récupération du classement hebdomadaire:",
        error,
      );
      return null;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Agréger les durées par utilisateur
    const userMap = new Map<
      string,
      {
        username: string;
        total_duration: number;
        country: string | null;
        region: string | null;
        subregion: string | null;
        team_id: string | null;
        teams: { name: string } | null;
      }
    >();

    data.forEach((measure: any) => {
      const user = measure.users;
      if (!user || !user.username) return;

      const existing = userMap.get(user.username);
      if (existing) {
        existing.total_duration += measure.duration;
      } else {
        // user.teams peut être un tableau ici aussi selon la version de Supabase/JS SDK
        const teamInfo = Array.isArray(user.teams) ? user.teams[0] : user.teams;

        userMap.set(user.username, {
          username: user.username,
          total_duration: measure.duration,
          country: user.country,
          region: user.region,
          subregion: user.subregion,
          team_id: user.team_id,
          teams: teamInfo,
        });
      }
    });

    // Convertir en tableau et trier par durée décroissante
    const ranking = Array.from(userMap.values())
      .sort((a, b) => b.total_duration - a.total_duration)
      .slice(0, 100); // Top 10

    return ranking;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération du classement hebdomadaire:",
      error,
    );
    return null;
  }
}
