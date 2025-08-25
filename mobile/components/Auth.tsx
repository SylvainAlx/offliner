import { COLORS } from "shared/theme";
import { useAuth } from "@/hooks/useAuth";
import { globalStyles } from "@/styles/global.styles";
import React from "react";
import { Text, View } from "react-native";
import { TextInput, Button } from "react-native-paper";

export default function Auth() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    passwordRef,
    signIn,
    signUp,
  } = useAuth();

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Connexion</Text>
      <Text style={globalStyles.contentText}>
        La connexion à un compte est facultative mais conseillée si vous
        souhaitez sauvegarder votre temps passé hors ligne et le cumuler avec
        d&apos;autres appareils
      </Text>
      <View style={globalStyles.card}>
        <View style={globalStyles.verticallySpaced}>
          <TextInput
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            style={globalStyles.input}
            placeholder="adresse e-mail"
            textColor={COLORS.text}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
            ref={passwordRef}
          />
        </View>

        <View style={globalStyles.verticallySpaced}>
          <TextInput
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            style={globalStyles.input}
            placeholder="Mot de passe"
            textColor={COLORS.text}
            secureTextEntry
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={signIn}
            ref={passwordRef}
            theme={{ colors: { text: COLORS.text, placeholder: COLORS.text } }}
          />
        </View>

        <View style={globalStyles.buttonContainer}>
          <Button
            mode="contained"
            onPress={signIn}
            disabled={loading}
            buttonColor={COLORS.primary}
            style={[globalStyles.button, { borderRadius: 100 }]}
          >
            Se connecter
          </Button>

          <Button
            mode="contained"
            onPress={signUp}
            disabled={loading}
            buttonColor={COLORS.primary}
            style={[globalStyles.button, { borderRadius: 100 }]}
          >
            Créer un compte
          </Button>
        </View>
      </View>
    </View>
  );
}
