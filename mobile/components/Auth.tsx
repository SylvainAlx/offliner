import React, { useState } from "react";
import { Text, View, Keyboard, TouchableWithoutFeedback } from "react-native";
import { TextInput, Button } from "react-native-paper";
import { COLORS } from "shared/theme";
import { useAuth } from "@/hooks/useAuth";
import { globalStyles } from "@/styles/global.styles";

export default function Auth() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    passwordRef,
    emailRef,
    signIn,
    signUp,
  } = useAuth();

  const [showPassword, setShowPassword] = useState(false);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
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
              ref={emailRef}
              onSubmitEditing={() => passwordRef.current?.focus()}
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
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={signIn}
              ref={passwordRef}
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
    </TouchableWithoutFeedback>
  );
}
