import { confirmDialog, showMessage } from "@/utils/formatNotification";
import { supabase } from "@/utils/supabase";
import * as SecureStore from "expo-secure-store";
import { z } from "zod";

// Zod Schemas for Supabase Auth
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().optional(),
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
      showMessage("Connexion réussie 🎉");
    } else {
      showMessage("Veuillez vérifier votre boîte mail pour continuer.");
    }
  } catch (error) {
    if (error instanceof Error) {
      showMessage(error.message);
    } else {
      showMessage("Une erreur est survenue lors de la connexion.");
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

    if (!session) {
      showMessage(
        "Veuillez vérifier votre boîte mail pour activer votre compte."
      );
    } else {
      showMessage("Inscription réussie 🎉");
    }
  } catch (error) {
    if (error instanceof Error) {
      showMessage(error.message);
    } else {
      showMessage("Une erreur est survenue lors de l'inscription.");
    }
    return;
  }
}

export async function logout() {
  const confirmed = await confirmDialog(
    "Es-tu sûr de vouloir te déconnecter ?"
  );

  if (confirmed) {
    await supabase.auth.signOut();
    await SecureStore.deleteItemAsync("supabase_refresh_token");
    showMessage("Déconnexion réussie");
    return true;
  }
}

export async function deleteAccount() {
  const confirmed = await confirmDialog(
    "Es-tu sûr de vouloir supprimer ton compte ? Cette action est irréversible."
  );

  if (!confirmed) return;

  try {
    // Récupération du token utilisateur
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;

    const { session } = GetSessionDataSchema.parse(data);
    const accessToken = session?.access_token;

    if (!accessToken) {
      showMessage("Impossible de récupérer la session utilisateur.");
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
      showMessage("suppression impossible : " + error.message);
      return;
    }

    // Déconnexion après suppression
    await supabase.auth.signOut();

    showMessage(
      "Compte supprimé (données supprimées, utilisateur déconnecté)."
    );
    return true;
  } catch (error) {
    if (error instanceof Error) {
      showMessage(error.message);
    }
  }
}