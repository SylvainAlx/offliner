import { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { updatePassword } from "@/api/auth";
import { useSession } from "@/contexts/SessionContext";
import { router } from "expo-router";

export default function ResetPassword() {
  const { session } = useSession();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Attendre que la session soit chargée
    const timer = setTimeout(() => {
      if (!session) {
        setError(
          "Session expirée. Veuillez demander un nouveau lien de réinitialisation.",
        );
        setIsLoading(false);
      }
    }, 5000); // Attendre max 5 secondes pour la session

    if (session) {
      setIsLoading(false);
      clearTimeout(timer);
    }

    return () => clearTimeout(timer);
  }, [session]);

  const isValid =
    password.length >= 6 &&
    confirmPassword.length >= 6 &&
    password === confirmPassword;

  const handleSubmit = async () => {
    if (!isValid) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (!session) {
      setError(
        "Session expirée. Veuillez demander un nouveau lien de réinitialisation.",
      );
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await updatePassword(password);
      // Rediriger vers la page de connexion après succès
      setTimeout(() => {
        router.replace("/");
      }, 2000);
    } catch (err) {
      setError(
        "Une erreur est survenue lors de la mise à jour du mot de passe.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 16, fontSize: 16, color: "#666" }}>
          Chargement de la session...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ padding: 24, gap: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "600", marginBottom: 8 }}>
        Nouveau mot de passe
      </Text>

      <TextInput
        secureTextEntry
        placeholder="Nouveau mot de passe"
        onChangeText={setPassword}
        value={password}
        editable={!isSubmitting && !!session}
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          padding: 12,
          borderRadius: 10,
          fontSize: 16,
          backgroundColor: !session || isSubmitting ? "#f5f5f5" : "white",
        }}
      />

      <TextInput
        secureTextEntry
        placeholder="Confirme ton mot de passe"
        onChangeText={setConfirmPassword}
        value={confirmPassword}
        editable={!isSubmitting && !!session}
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          padding: 12,
          borderRadius: 10,
          fontSize: 16,
          backgroundColor: !session || isSubmitting ? "#f5f5f5" : "white",
        }}
      />

      {error ? (
        <Text style={{ color: "red", marginTop: -8 }}>{error}</Text>
      ) : null}

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={!isValid || !session || isSubmitting}
        style={{
          backgroundColor:
            isValid && session && !isSubmitting ? "#007bff" : "#9cbcf2",
          paddingVertical: 14,
          borderRadius: 10,
          alignItems: "center",
          marginTop: 6,
          flexDirection: "row",
          justifyContent: "center",
        }}
      >
        {isSubmitting ? (
          <>
            <ActivityIndicator
              size="small"
              color="white"
              style={{ marginRight: 8 }}
            />
            <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>
              Mise à jour...
            </Text>
          </>
        ) : (
          <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>
            Valider
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
