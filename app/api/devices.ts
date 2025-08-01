import { showMessage } from "@/utils/formatNotification";
import { supabase } from "@/utils/supabase";
import { Session } from "@supabase/supabase-js";

export async function getDeviceId(session: Session, deviceName: string) {
  try {
    if (!session?.user) throw new Error("Aucune session active.");

    const { data, error, status } = await supabase
      .from("devices")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("name", deviceName)
      .limit(1);

    if (error && status !== 406) throw error;
    if (data && data.length > 0) {
      return data[0].id; // Return the first device ID found
    } else {
      throw new Error("L'appareil n'existe pas pour cet utilisateur.");
    }
  } catch (error) {
    if (error instanceof Error) {
      showMessage(error.message);
    }
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
        "Un appareil avec ce nom existe déjà pour cet utilisateur."
      );
    }

    const { error } = await supabase.from("devices").upsert(
      [
        {
          user_id: session.user.id,
          name: deviceName,
        },
      ],
      { onConflict: "user_id,name" } // très important
    );

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      showMessage(error.message);
    }
    return { success: false };
  }
}
