import { z } from "zod";
import { supabase } from "@/utils/supabase";
import { showMessage } from "@/utils/formatNotification";
// Assuming 'shared/config.ts' is located two directories above 'mobile/api/'
import { PROJECT } from "shared/config";

// Schema for the row in the 'config' table
const ConfigSchema = z.object({
  value: z.string(),
});

/**
 * Checks if the 'mobile-version' in the remote config table
 * matches the local project version.
 * @returns {Promise<boolean>} - True if versions match, false otherwise.
 */
export async function checkMobileVersion(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from("config")
      .select("value")
      .eq("label", "version")
      .single();

    if (error) {
      throw error;
    }

    const remoteConfig = ConfigSchema.parse(data);

    const isMatch = PROJECT.VERSION >= remoteConfig.value;

    if (isMatch) {
      return "valid";
    } else {
      return "invalid";
    }
  } catch (error) {
    if (error instanceof Error) {
      showMessage(
        `Impossible de vérifier la version de l'application : ${error.message}`,
        "error",
        "Erreur",
      );
    } else {
      showMessage(
        "Une erreur inconnue est survenue lors de la vérification de version de l'application.",
        "error",
        "Erreur",
      );
    }
    // In case of an error, prevent app from proceeding
    return "error";
  }
}
