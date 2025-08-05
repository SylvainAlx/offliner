import { showMessage } from "@/utils/formatNotification";
import { supabase } from "@/utils/supabase";
import { Session } from "@supabase/supabase-js";
import { getDeviceId } from "./devices";

export async function getAllMeasures(session: Session) {
  try {
    if (!session?.user) throw new Error("Aucune session active.");

    const { data, error, status } = await supabase
      .from("measures")
      .select(`date, duration`)
      .eq("user_id", session?.user.id);
    if (error && status !== 406) {
      throw error;
    }

    if (data) {
      return data;
    }
  } catch (error) {
    if (error instanceof Error) {
      showMessage(error.message);
    }
  }
}

export async function getTotalDuration(session: Session) {
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
      data?.reduce((sum, item) => sum + (item.duration || 0), 0) ?? 0;
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
  duration: number
) {
  try {
    if (!session?.user) throw new Error("Aucune session active.");
    if (duration <= 0) {
      throw new Error("La durée doit être supérieure à 0 secondes.");
    }

    const deviceId = await getDeviceId(session, deviceName);
    const userId = session.user.id;

    // Vérifie s'il existe déjà une mesure pour cette date / user / device
    const { data: existing, error: fetchError } = await supabase
      .from("measures")
      .select("id, duration")
      .eq("user_id", userId)
      .eq("device_id", deviceId)
      .eq("date", date)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // "PGRST116" = Pas de ligne trouvée (pas une vraie erreur ici)
      throw fetchError;
    }

    if (existing) {
      // Mise à jour : on incrémente la durée
      const { error: updateError } = await supabase
        .from("measures")
        .update({
          duration: existing.duration + duration,
        })
        .eq("id", existing.id);

      if (updateError) {
        throw updateError;
      }
    } else {
      // Insertion classique
      const { error: insertError } = await supabase.from("measures").insert([
        {
          user_id: userId,
          device_id: deviceId,
          date,
          duration,
        },
      ]);

      if (insertError) {
        throw insertError;
      }
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
