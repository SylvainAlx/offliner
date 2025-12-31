import { showMessage } from "@/utils/formatNotification";
import { supabase } from "@/utils/supabase";
import { Session } from "@supabase/supabase-js";
import { z } from "zod";
import { getCurrentWeekRange } from "shared/utils/dateUtils";

const UserSchema = z.object({
  username: z.string().nullable(),
  country: z.string().nullable(),
  region: z.string().nullable(),
  subregion: z.string().nullable(),
  gem_balance: z.number().min(0),
  daily_goal_seconds: z.number().nullable(),
  team_id: z.string().nullable(),
});

export type UserProfile = z.infer<typeof UserSchema>;

export async function getUser(session: Session): Promise<UserProfile | null> {
  try {
    if (!session?.user) throw new Error("Aucune session active.");

    const { data, error, status } = await supabase
      .from("users")
      .select(
        `username, country, region, subregion, gem_balance, daily_goal_seconds, team_id`,
      )
      .eq("id", session?.user.id)
      .single();

    if (error && status !== 406) {
      throw error;
    }

    if (data) {
      return UserSchema.parse(data);
    }
    return null;
  } catch (error: any) {
    console.error(error);
    showMessage(
      error?.message || "Une erreur est survenue.",
      "error",
      "Erreur",
    );
    return null;
  }
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

export async function updateUser({
  session,
  username,
  country,
  region,
  subregion,
}: {
  session: Session;
  username: string;
  country: string | null;
  region: string | null;
  subregion: string | null;
}) {
  if (!session?.user) throw new Error("Aucune session active.");

  const { error } = await supabase
    .from("users")
    .update({
      username,
      country,
      region,
      subregion,
      updated_at: new Date().toISOString(),
    })
    .eq("id", session.user.id);

  if (error) {
    console.error(error);
    throw error;
  }
}
export async function getUsersRanking() {
  const { data, error } = await supabase
    .from("users")
    .select(
      `
      username, 
      total_duration, 
      country, 
      region, 
      subregion
    `,
    )
    .not("total_duration", "is", null)
    .order("total_duration", { ascending: false })
    .limit(10); // 👉 top 10

  if (error) {
    console.error("Erreur Supabase :", error);
    return null;
  }

  return data.map((u: any) => ({
    ...u,
  }));
}

export async function getWeeklyLeagueRanking() {
  try {
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
          subregion
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
        team: { id: string; name: string } | null;
      }
    >();

    data.forEach((measure: any) => {
      const user = measure.users;
      if (!user || !user.username) return;

      const existing = userMap.get(user.username);
      if (existing) {
        existing.total_duration += measure.duration;
      } else {
        userMap.set(user.username, {
          username: user.username,
          total_duration: measure.duration,
          country: user.country,
          region: user.region,
          subregion: user.subregion,
          team: Array.isArray(user.team)
            ? user.team[0] || null
            : user.team || null,
        });
      }
    });

    // Convertir en tableau et trier par durée décroissante
    const ranking = Array.from(userMap.values())
      .sort((a, b) => b.total_duration - a.total_duration)
      .slice(0, 10); // Top 10

    return ranking;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération du classement hebdomadaire:",
      error,
    );
    return null;
  }
}

export async function updateTotalDuration(user_id: string, amount: number) {
  // Mise à jour du total_duration
  const duration = Math.floor(amount);
  const { error: updateUserError } = await supabase.rpc(
    "increment_total_duration",
    {
      user_id,
      amount: duration,
    },
  );
  if (updateUserError) throw updateUserError;
}

export async function updateDailyGoal(
  session: Session,
  goalSeconds: number | null,
) {
  try {
    if (!session?.user) throw new Error("Aucune session active.");

    const { error } = await supabase
      .from("users")
      .update({ daily_goal_seconds: goalSeconds })
      .eq("id", session.user.id);

    if (error) {
      throw error;
    }
  } catch (error: any) {
    showMessage(
      error?.message || "Une erreur est survenue.",
      "error",
      "Erreur",
    );
    throw error;
  }
}
