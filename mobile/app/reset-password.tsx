import { useState } from "react";
import { View, TextInput, Text, TouchableOpacity } from "react-native";
import { updatePassword } from "@/api/auth";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const isValid =
    password.length >= 6 &&
    confirmPassword.length >= 6 &&
    password === confirmPassword;

  const handleSubmit = async () => {
    if (!isValid) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setError("");
    await updatePassword(password);
  };

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
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          padding: 12,
          borderRadius: 10,
          fontSize: 16,
        }}
      />

      <TextInput
        secureTextEntry
        placeholder="Confirme ton mot de passe"
        onChangeText={setConfirmPassword}
        value={confirmPassword}
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          padding: 12,
          borderRadius: 10,
          fontSize: 16,
        }}
      />

      {error ? (
        <Text style={{ color: "red", marginTop: -8 }}>{error}</Text>
      ) : null}

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={!isValid}
        style={{
          backgroundColor: isValid ? "#007bff" : "#9cbcf2",
          paddingVertical: 14,
          borderRadius: 10,
          alignItems: "center",
          marginTop: 6,
        }}
      >
        <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>
          Valider
        </Text>
      </TouchableOpacity>
    </View>
  );
}
