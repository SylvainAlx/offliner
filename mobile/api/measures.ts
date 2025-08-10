import { showMessage } from "@/utils/formatNotification";
import { supabase } from "@/utils/supabase";
import { Session } from "@supabase/supabase-js";
import { getDeviceId } from "./devices";
import { z } from "zod";

const MeasureSchema = z.object({
  date: z.string(),
  duration: z.number(),
  user_id: z.string(),
  device_id: z.number().nullable(),
});

export type Measure = z.infer<typeof MeasureSchema>;

export async function getAllMeasures(
  session: Session,
): Promise<Measure[] | null> {
  try {
    if (!session?.user) throw new Error("Aucune session active.");

    const { data, error, status } = await supabase
      .from("measures")
      .select(`date, duration, user_id, device_id`)
      .eq("user_id", session?.user.id);
    if (error && status !== 406) {
      throw error;
    }

    if (data) {
      return z.array(MeasureSchema).parse(data);
    }
    return null;
  } catch (error) {
    if (error instanceof Error) {
      showMessage(error.message);
    }
    return null;
  }
}

export async function getTotalDuration(session: Session): Promise<number> {
  try {
    if (!session?.user) throw new Error("Aucune session active.");

    const { data, error, status } = await supabase
      .from("measures")
      .select("duration", { count: "exact", head: false })
      .eq("user_id", session.user.id);

    if (error && status !== 406) {
      throw error;
    }

    const total =
      z
        .array(z.object({ duration: z.number() }))
        .parse(data || [])
        .reduce((sum, item) => sum + (item.duration || 0), 0) ?? 0;
    return total;
  } catch (error) {
    if (error instanceof Error) {
      showMessage(error.message);
    }
    return 0;
  }
}

export async function insertMeasure(
  session: Session,
  deviceName: string,
  date: string,
  duration: number,
) {
  try {
    if (!session?.user) throw new Error("Aucune session active.");
    if (duration <= 0) {
      throw new Error("La durée doit être supérieure à 0 secondes.");
    }

    const device = await getDeviceId(session, deviceName);
    const userId = session.user.id;

    // Vérifie s'il existe déjà une mesure pour cette date / user / device
    const { data: existing, error: fetchError } = await supabase
      .from("measures")
      .select("id, duration")
      .eq("user_id", userId)
      .eq("device_id", device?.id)
      .eq("date", date)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // "PGRST116" = Pas de ligne trouvée (pas une vraie erreur ici)
      throw fetchError;
    }

    if (existing) {
      // Mise à jour de la mesure
      const { error: updateMeasureError } = await supabase
        .from("measures")
        .update({
          duration: existing.duration + duration,
        })
        .eq("id", existing.id);

      if (updateMeasureError) {
        throw updateMeasureError;
      }

      // Mise à jour du total_duration
      const { error: updateUserError } = await supabase.rpc(
        "increment_total_duration",
        {
          user_id: userId,
          amount: duration,
        },
      );
      if (updateUserError) throw updateUserError;
    } else {
      // Insertion classique
      const { error: insertError } = await supabase.from("measures").insert([
        {
          user_id: userId,
          device_id: device?.id,
          date,
          duration,
        },
      ]);
      if (insertError) throw insertError;

      // Mise à jour du total_duration
      const { error: updateUserError } = await supabase.rpc(
        "increment_total_duration",
        {
          user_id: userId,
          amount: duration,
        },
      );
      if (updateUserError) throw updateUserError;
    }

    showMessage("Synchronisation réussie 🎉");
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      showMessage(error.message);
    }
    return { success: false };
  }
}
