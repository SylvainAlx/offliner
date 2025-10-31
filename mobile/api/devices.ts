import { showMessage } from "@/utils/formatNotification";
import { supabase } from "@/utils/supabase";
import { Session } from "@supabase/supabase-js";
import { z } from "zod";

const DeviceSchema = z.object({
  id: z.number(),
  name: z.string(),
  user_id: z.string(),
});

export type Device = z.infer<typeof DeviceSchema>;

export async function getDeviceId(
  session: Session,
  deviceName: string,
): Promise<Device | null> {
  try {
    if (!session?.user) throw new Error("Aucune session active.");

    const { data, error, status } = await supabase
      .from("devices")
      .select("id, name, user_id")
      .eq("user_id", session.user.id)
      .eq("name", deviceName)
      .limit(1);

    if (error && status !== 406) throw error;
    if (data && data.length > 0) {
      return DeviceSchema.parse(data[0]); // Return the first device found
    } else {
      return null; // No device found
    }
  } catch (error) {
    if (error instanceof Error) {
      showMessage(error.message, "error", "Erreur");
    }
    return null;
  }
}

export async function insertDevice(session: Session, deviceName: string) {
  try {
    if (!session?.user) throw new Error("Aucune session active.");

    const { data: existingDevices, error: selectError } = await supabase
      .from("devices")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("name", deviceName)
      .limit(1);

    if (selectError) throw selectError;
    if (existingDevices && existingDevices.length > 0) {
      throw new Error(
        "Un appareil avec ce nom existe déjà pour cet utilisateur.",
      );
    }

    const { error } = await supabase.from("devices").upsert(
      [
        {
          user_id: session.user.id,
          name: deviceName,
        },
      ],
      { onConflict: "user_id,name" }, // très important
    );

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      showMessage(error.message, "error", "Erreur");
    }
    return { success: false };
  }
}

export async function getLatestDeviceNameByUserId(
  userId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("devices")
    .select("name")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Erreur Supabase :", error);
    return "";
  }

  return data?.[0]?.name ?? "";
}
