import { showMessage } from "@/utils/formatNotification";
import { supabase } from "@/utils/supabase";
import { Session } from "@supabase/supabase-js";
import { getDeviceId } from "./devices";
import { z } from "zod";
import { updateTotalDuration } from "./users";

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
      .eq("user_id", session?.user.id)
      .order("date", { ascending: false })
      .limit(20);
    if (error && status !== 406) {
      throw error;
    }

    if (data) {
      return z.array(MeasureSchema).parse(data);
    }
    return null;
  } catch (error) {
    if (error instanceof Error) {
      showMessage(error.message, "error", "Erreur");
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
      showMessage(error.message, "error", "Erreur");
    }
    return 0;
  }
}

export async function getWeeklyDuration(session: Session): Promise<number> {
  try {
    if (!session?.user) throw new Error("Aucune session active.");

    const today = new Date();

    // nombre de jours depuis lundi (0 = lundi, 6 = dimanche)
    const daysSinceMonday = (today.getDay() + 6) % 7;
    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - daysSinceMonday);

    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);

    // format YYYY-MM-DD en tenant compte du fuseau local
    const formatDateLocal = (d: Date) => d.toLocaleDateString("en-CA"); // "en-CA" => yyyy-mm-dd

    const start = formatDateLocal(firstDayOfWeek);
    const end = formatDateLocal(lastDayOfWeek);

    const { data, error, status } = await supabase
      .from("measures")
      .select("duration, date", { count: "exact", head: false })
      .eq("user_id", session.user.id)
      .gte("date", start)
      .lte("date", end);

    if (error && status !== 406) throw error;

    const total =
      z
        .array(z.object({ duration: z.number().optional() }))
        .parse(data || [])
        .reduce((sum, item) => sum + (item.duration || 0), 0) ?? 0;

    return total;
  } catch (error) {
    if (error instanceof Error) {
      showMessage(error.message, "error", "Erreur");
    }
    return 0;
  }
}

export async function getDailyDuration(session: Session): Promise<number> {
  try {
    if (!session?.user) throw new Error("Aucune session active.");

    // --- Date du jour au format YYYY-MM-DD ---
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];

    // --- Requête Supabase ---
    const { data, error, status } = await supabase
      .from("measures")
      .select("duration, date", { count: "exact", head: false })
      .eq("user_id", session.user.id)
      .eq("date", formattedDate);

    if (error && status !== 406) throw error;

    // --- Validation et somme ---
    const total =
      z
        .array(z.object({ duration: z.number() }))
        .parse(data || [])
        .reduce((sum, item) => sum + (item.duration || 0), 0) ?? 0;

    return total;
  } catch (error) {
    if (error instanceof Error) {
      showMessage(error.message, "error", "Erreur");
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

    // Vérifie le total existant pour cette date (tous devices confondus)
    const { data: measures, error: totalFetchError } = await supabase
      .from("measures")
      .select("duration")
      .eq("user_id", userId)
      .eq("date", date);

    if (totalFetchError) throw totalFetchError;

    const totalExisting =
      measures?.reduce((sum, m) => sum + m.duration, 0) ?? 0;

    // Durée encore disponible avant d'atteindre 24h
    const remaining = 86400 - totalExisting;

    if (remaining <= 0) {
      throw new Error(
        "Impossible d'enregistrer : la journée est déjà complète (24h atteintes).",
      );
    }

    // Tronque la durée si elle dépasse le reste disponible
    const durationToInsert = Math.min(duration, remaining);

    // Vérifie si une mesure existe déjà pour ce device à cette date
    const { data: existing, error: fetchError } = await supabase
      .from("measures")
      .select("id, duration")
      .eq("user_id", userId)
      .eq("device_id", device?.id)
      .eq("date", date)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      throw fetchError;
    }

    if (existing) {
      // Mise à jour de la mesure
      const { error: updateMeasureError } = await supabase
        .from("measures")
        .update({
          duration: existing.duration + durationToInsert,
        })
        .eq("id", existing.id);

      if (updateMeasureError) {
        throw updateMeasureError;
      }
    } else {
      // Insertion classique
      const { error: insertError } = await supabase.from("measures").insert([
        {
          user_id: userId,
          device_id: device?.id,
          date,
          duration: durationToInsert,
        },
      ]);
      if (insertError) throw insertError;
    }

    await updateTotalDuration(userId, durationToInsert);

    if (durationToInsert < duration) {
      showMessage(
        `Durée tronquée : seules ${durationToInsert} secondes ont été enregistrées (24h max atteintes).`,
      );
    }

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      showMessage(error.message, "error", "Erreur");
    }
    return { success: false };
  }
}
