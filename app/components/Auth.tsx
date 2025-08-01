import { signInWithEmail, signUpWithEmail } from "@/api/auth";
import { COLORS } from "@/constants/Theme";
import { globalStyles } from "@/styles/global.styles";
import { supabase } from "@/utils/supabase";
import { Button, Input } from "@rneui/themed";
import React, { useRef, useState } from "react";
import { AppState, Text, TextInput, View } from "react-native";

// Tells Supabase Auth to continuously refresh the session automatically if
// the app is in the foreground. When this is added, you will continue to receive
// `onAuthStateChange` events with the `TOKEN_REFRESHED` or `SIGNED_OUT` event
// if the user's session is terminated. This should only be registered once.
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  async function signIn() {
    setLoading(true);
    signInWithEmail(email, password);
    setLoading(false);
  }

  async function signUp() {
    setLoading(true);
    signUpWithEmail(email, password);
    setLoading(false);
  }

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Connexion</Text>
      <Text style={globalStyles.contentText}>
        La connexion à un compte est facultative mais conseillée si vous
        souhaitez sauvegarder votre temps passé hors ligne et le cummuler avec
        d&apos;autres appareils
      </Text>
      <View style={globalStyles.card}>
        <View style={[globalStyles.verticallySpaced]}>
          <Input
            style={globalStyles.input}
            label="E-mail"
            labelStyle={{ color: COLORS.text }}
            leftIcon={{ type: "font-awesome", name: "envelope" }}
            onChangeText={(text) => setEmail(text)}
            value={email}
            placeholder="adresse e-mail"
            placeholderTextColor={COLORS.text}
            autoCapitalize={"none"}
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
        </View>
        <View style={globalStyles.verticallySpaced}>
          <Input
            style={globalStyles.input}
            label="Mot de passe"
            labelStyle={{ color: COLORS.text }}
            leftIcon={{ type: "font-awesome", name: "lock" }}
            onChangeText={(text) => setPassword(text)}
            value={password}
            secureTextEntry={true}
            placeholder="Mot de passe"
            placeholderTextColor={COLORS.text}
            autoCapitalize={"none"}
            returnKeyType="done"
            onSubmitEditing={signIn}
          />
        </View>
        <View style={[globalStyles.buttonContainer]}>
          <Button
            title="Se connecter"
            disabled={loading}
            onPress={signIn}
            color={COLORS.primary}
            radius={100}
            style={globalStyles.button}
          />
          <Button
            title="Créer un compte"
            disabled={loading}
            onPress={() => signUp()}
            color={COLORS.primary}
            radius={100}
            style={globalStyles.button}
          />
        </View>
      </View>
    </View>
  );
}
