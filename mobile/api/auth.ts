import { confirmDialog, showMessage } from "@/utils/formatNotification";
import { supabase } from "@/utils/supabase";
import * as SecureStore from "expo-secure-store";
import { z } from "zod";

// Zod Schemas for Supabase Auth
const UserSchema = z.object({
  id: z.string().pipe(z.uuid()),
  email: z.string().pipe(z.email()).optional(),
});

const SessionSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  user: UserSchema,
});

// Schema for the data object returned by signInWithPassword and signUp
const AuthDataSchema = z.object({
  session: SessionSchema.nullable(),
  user: UserSchema.nullable(),
});

// Schema for the data object returned by getSession
const GetSessionDataSchema = z.object({
  session: SessionSchema.nullable(),
});

export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    const { session } = AuthDataSchema.parse(data);

    if (session) {
      showMessage("Connexion réussie 🎉", "success");
    }
  } catch (error) {
    if (error instanceof Error) {
      showMessage(error.message, "error");
    } else {
      showMessage(
        "Une erreur est survenue lors de la connexion.",
        "error",
        "Erreur",
      );
    }
    return;
  }
}

export async function signUpWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    const { session } = AuthDataSchema.parse(data);

    if (session) {
      showMessage("Inscription réussie 🎉", "success");
    }
  } catch (error) {
    if (error instanceof Error) {
      showMessage(error.message, "error", "Erreur");
    } else {
      showMessage(
        "Une erreur est survenue lors de l'inscription.",
        "error",
        "Erreur",
      );
    }
    return;
  }
}

export async function logout() {
  const confirmed = await confirmDialog(
    "Es-tu sûr de vouloir te déconnecter ?",
  );

  if (confirmed) {
    try {
      await supabase.auth.signOut();
      await SecureStore.deleteItemAsync("supabase_refresh_token");
      showMessage("Déconnexion réussie", "success");
      return true;
    } catch (error) {
      console.error("Logout error:", error);
      showMessage("Erreur lors de la déconnexion", "error", "Erreur");
      return false;
    }
  }
}

export async function deleteAccount() {
  const confirmed = await confirmDialog(
    "Es-tu sûr de vouloir supprimer ton compte ? Cette action est irréversible.",
  );

  if (!confirmed) return;

  try {
    // Récupération du token utilisateur
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;

    const { session } = GetSessionDataSchema.parse(data);
    const accessToken = session?.access_token;

    if (!accessToken) {
      showMessage(
        "Impossible de récupérer la session utilisateur.",
        "error",
        "Erreur",
      );
      return;
    }

    // Appel de l'Edge Function avec le token dans les headers
    const { error } = await supabase.functions.invoke("delete-user-and-data", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (error) {
      showMessage(
        "suppression impossible : " + error.message,
        "error",
        "Erreur",
      );
      return;
    }

    // Déconnexion après suppression
    await supabase.auth.signOut();

    showMessage(
      "Compte supprimé (données supprimées, utilisateur déconnecté).",
      "success",
    );
    return true;
  } catch (error) {
    if (error instanceof Error) {
      showMessage(error.message, "error", "Erreur");
    }
  }
}
