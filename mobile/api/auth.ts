import { confirmDialog, showMessage } from "@/utils/formatNotification";
import { supabase } from "@/utils/supabase";

export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      showMessage(error.message);
    } else if (data.session) {
      showMessage("Connexion réussie 🎉");
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
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      showMessage(error.message);
      return;
    }

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
    showMessage("Déconnexion réussie");
  }
}

export async function deleteAccount() {
  const confirmed = await confirmDialog(
    "Es-tu sûr de vouloir supprimer ton compte ? Cette action est irréversible."
  );

  if (!confirmed) return;

  try {
    // Récupération du token utilisateur
    const sessionResult = await supabase.auth.getSession();
    const accessToken = sessionResult.data.session?.access_token;

    if (!accessToken) {
      showMessage("Impossible de récupérer la session utilisateur.");
      return;
    }

    // Appel de l'Edge Function avec le token dans les headers
    const { error } = await supabase.functions.invoke("delete-user-and-data", {
      body: { name: "Functions" }, // Tu peux enlever ce body si ta fonction ne l'utilise pas
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (error) {
      showMessage(error.message);
      return;
    }

    // Déconnexion après suppression
    await supabase.auth.signOut();

    showMessage(
      "Compte supprimé (données supprimées, utilisateur déconnecté)."
    );
  } catch (error) {
    if (error instanceof Error) {
      showMessage(error.message);
    }
  }
}
