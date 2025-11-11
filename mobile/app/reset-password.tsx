import { useState } from "react";
import { View, TextInput, Button } from "react-native";
import { updatePassword } from "@/api/auth";

export default function ResetPassword() {
  const [password, setPassword] = useState("");

  const handleSubmit = async () => {
    await updatePassword(password);
  };

  return (
    <View style={{ padding: 20, gap: 10 }}>
      <TextInput
        secureTextEntry
        placeholder="Nouveau mot de passe"
        onChangeText={setPassword}
        value={password}
        style={{ borderWidth: 1, padding: 10 }}
      />
      <Button title="Valider" onPress={handleSubmit} />
    </View>
  );
}
