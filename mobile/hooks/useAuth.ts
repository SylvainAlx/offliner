import { signInWithEmail, signUpWithEmail } from "@/api/auth";
import { showMessage } from "@/utils/formatNotification";
import { supabase } from "@/utils/supabase";
import { useEffect, useRef, useState } from "react";
import { AppState, TextInput } from "react-native";
import { useBiometricAuth } from "./useBiometricAuth";

export const useAuth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);

  const {
    checkBiometricAvailability,
    promptToEnableBiometrics,
    saveRefreshToken,
    loginWithBiometrics,
  } = useBiometricAuth();

  const passwordRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);

  useEffect(() => {
    const checkAvailability = async () => {
      const available = await checkBiometricAvailability();
      setIsBiometricAvailable(available);
    };
    checkAvailability();
  }, [checkBiometricAvailability]);

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
        promptToEnableBiometrics(() => {
          if (data.session?.refresh_token) {
            saveRefreshToken(data.session.refresh_token);
          }
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        showMessage(error.message);
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
        promptToEnableBiometrics(() => {
          if (data.session?.refresh_token) {
            saveRefreshToken(data.session.refresh_token);
          }
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        showMessage(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function signInWithBiometrics() {
    setLoading(true);
    try {
      await loginWithBiometrics();
    } catch (error) {
      if (error instanceof Error) {
        showMessage(error.message);
      }
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
    emailRef,
    signIn,
    signUp,
    signInWithBiometrics,
    isBiometricAvailable,
  };
};
