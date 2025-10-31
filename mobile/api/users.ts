import { showMessage } from "@/utils/formatNotification";
import { supabase } from "@/utils/supabase";
import { Session } from "@supabase/supabase-js";
import { z } from "zod";

const UserSchema = z.object({
  username: z.string().nullable(),
  country: z.string().nullable(),
  region: z.string().nullable(),
  subregion: z.string().nullable(),
});

export type UserProfile = z.infer<typeof UserSchema>;

export async function getUser(session: Session): Promise<UserProfile | null> {
  try {
    if (!session?.user) throw new Error("Aucune session active.");

    const { data, error, status } = await supabase
      .from("users")
      .select(`username, country, region, subregion`)
      .eq("id", session?.user.id)
      .single();

    if (error && status !== 406) {
      throw error;
    }

    if (data) {
      return UserSchema.parse(data);
    }
    return null;
  } catch (error) {
    if (error instanceof Error) {
      showMessage(error.message, "error", "Erreur");
    }
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
  try {
    if (!session?.user) throw new Error("Aucune session active.");

    const updates = {
      id: session?.user.id,
      username,
      country,
      region,
      subregion,
      updated_at: new Date(),
    };

    const { error } = await supabase.from("users").upsert(updates);

    if (error) {
      throw error;
    }
  } catch (error) {
    if (error instanceof Error) {
      showMessage(error.message, "error", "Erreur");
    }
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
