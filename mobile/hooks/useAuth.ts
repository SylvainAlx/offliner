import { signInWithEmail, signUpWithEmail } from "@/api/auth";
import { supabase } from "@/utils/supabase";
import { useEffect, useRef, useState } from "react";
import { AppState, TextInput } from "react-native";

export const useAuth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  useEffect(() => {
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });

    return () => {
      appStateSubscription.remove();
    };
  }, []);

  async function signIn() {
    setLoading(true);
    try {
      await signInWithEmail(email, password);
    } catch (e) {
      // Errors are handled in the signInWithEmail function
    } finally {
      setLoading(false);
    }
  }

  async function signUp() {
    setLoading(true);
    try {
      await signUpWithEmail(email, password);
    } catch (e) {
      // Errors are handled in the signUpWithEmail function
    } finally {
      setLoading(false);
    }
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    passwordRef,
    signIn,
    signUp,
  };
};
