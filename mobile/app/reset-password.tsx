import { globalStyles } from "@/styles/global.styles";
import { showMessage } from "@/utils/formatNotification";
import { supabase } from "@/utils/supabase";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { TextInput, Button } from "react-native-paper";
import { COLORS } from "shared/theme";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const params = useLocalSearchParams();

  // Supabase fournit un access_token dans l’URL
  // Expo Router mettra ça dans params (ex: params.access_token)

  async function handleReset() {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      if (error instanceof Error) {
        showMessage(error.message, "error", "Erreur");
      }
    } else {
      showMessage("Mot de passe mis à jour !", "success", "Mise à jour");
    }
  }

  return (
    <View style={globalStyles.verticallySpaced}>
      <TextInput
        value={password}
        onChangeText={setPassword}
        style={globalStyles.input}
        placeholder="Nouveau mot de passe"
        textColor={COLORS.text}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        returnKeyType="done"
        theme={{
          colors: { text: COLORS.text, placeholder: COLORS.text },
        }}
        right={
          <TextInput.Icon
            icon={showPassword ? "eye-off" : "eye"}
            onPress={() => setShowPassword(!showPassword)}
          />
        }
      />
      <View style={globalStyles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleReset}
          disabled={!password}
          buttonColor={COLORS.secondary}
          style={[globalStyles.button, { borderRadius: 100 }]}
        >
          Changer le mot de passe
        </Button>
      </View>
    </View>
  );
}
