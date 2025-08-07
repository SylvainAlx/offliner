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
      showMessage(error.message);
    }
    return null;
  }
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
      showMessage(error.message);
    }
  }
}
