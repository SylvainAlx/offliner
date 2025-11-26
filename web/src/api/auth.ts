import { supabase } from "../lib/supabase";

/**
 * Verifies if the current session has a valid password reset token
 * This should be called when the user lands on the reset password page
 */
export async function verifyPasswordResetToken(): Promise<{
  isValid: boolean;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return { isValid: false, error: error.message };
    }

    if (!data.session) {
      return {
        isValid: false,
        error: "Session expirée. Veuillez demander un nouveau lien.",
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: "Une erreur est survenue lors de la vérification.",
    };
  }
}

/**
 * Updates the user's password
 * @param newPassword - The new password to set
 */
export async function updatePassword(
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: "Une erreur est survenue lors de la mise à jour.",
    };
  }
}
