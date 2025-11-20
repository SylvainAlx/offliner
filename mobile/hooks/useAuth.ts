import {
  handleForgotPassword,
  signInWithEmail,
  signUpWithEmail,
} from "@/api/auth";
import { confirmDialog, showMessage } from "@/utils/formatNotification";
import { supabase } from "@/utils/supabase";
import { useEffect, useRef, useState } from "react";
import { AppState, TextInput } from "react-native";
import * as SecureStore from "expo-secure-store";
import { Session } from "@supabase/supabase-js";

export const useAuth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const REFRESH_TOKEN_KEY = "supabase_refresh_token";

  const passwordRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);

  const saveRefreshToken = async (refreshToken: string) => {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  };

  const saveSession = async (session: Session | null) => {
    if (session?.refresh_token) {
      await saveRefreshToken(session.refresh_token);
    }
  };

  useEffect(() => {
    const appStateSubscription = AppState.addEventListener(
      "change",
      (state) => {
        if (state === "active") {
          supabase.auth.startAutoRefresh();
        } else {
          supabase.auth.stopAutoRefresh();
        }
      },
    );

    return () => {
      appStateSubscription.remove();
    };
  }, []);

  async function signIn() {
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        saveSession(data.session);
      }
    } catch (error) {
      if (error instanceof Error) {
        showMessage(error.message, "error", "Erreur");
      }
    } finally {
      setLoading(false);
    }
  }

  async function signUp() {
    setLoading(true);
    try {
      await signUpWithEmail(email, password);
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        saveSession(data.session);
      }
    } catch (error) {
      if (error instanceof Error) {
        showMessage(error.message, "error", "Erreur");
      }
    } finally {
      setLoading(false);
    }
  }

  async function sendPasswordResetEmail(email: string) {
    if (!email) {
      showMessage("Veuillez saisir votre adresse e-mail.", "warn", "Attention");
      return;
    }
    const confirmed = await confirmDialog(
      "Envoyer un e-mail de réinitialisation du mot de passe ?",
    );

    if (confirmed) {
      try {
        await handleForgotPassword(email);
        showMessage(
          "Un e-mail de réinitialisation du mot de passe vous sera envoyé prochainement.",
          "success",
          "Succès",
        );
      } catch (error) {
        if (error instanceof Error) {
          showMessage(error.message, "error", "Erreur");
        }
      }
    }
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    passwordRef,
    emailRef,
    signIn,
    signUp,
    sendPasswordResetEmail,
  };
};
