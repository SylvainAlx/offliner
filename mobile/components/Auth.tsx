import { COLORS } from "@/constants/Theme";
import { useAuth } from "@/hooks/useAuth";
import { globalStyles } from "@/styles/global.styles";
import { Button, Input } from "@rneui/themed";
import React from "react";
import { Text, View } from "react-native";

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
