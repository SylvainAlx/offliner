import { globalStyles } from "@/styles/global.styles";
import { router } from "expo-router";
import { Text, ScrollView, Linking } from "react-native";
import ModernButton from "@/components/ui/ModernButton";
import { PROJECT, OWNER } from "shared/config";

export default function LegalsScreen() {
  return (
    <ScrollView showsVerticalScrollIndicator style={globalStyles.container}>
      <Text style={globalStyles.title}>Mentions légales</Text>

      <Text style={globalStyles.cardTitle}>Éditeur du site</Text>
      <Text style={globalStyles.contentText}>
        <Text style={{ fontWeight: "bold" }}>Nom :</Text> {OWNER.NAME}
      </Text>
      <Text style={globalStyles.contentText}>
        <Text style={{ fontWeight: "bold" }}>Email :</Text>{" "}
        <Text
          style={globalStyles.link}
          onPress={() => Linking.openURL(`mailto:${OWNER.CONTACT}`)}
        >
          {OWNER.CONTACT}
        </Text>
      </Text>
      <Text style={globalStyles.contentText}>
        <Text style={{ fontWeight: "bold" }}>Site web :</Text>{" "}
        <Text
          style={globalStyles.link}
          onPress={() => Linking.openURL(OWNER.WEBSITE)}
        >
          {OWNER.WEBSITE}
        </Text>
      </Text>

      <Text style={globalStyles.cardTitle}>Informations générales</Text>
      <Text style={globalStyles.contentText}>{PROJECT.DESCRIPTION}</Text>
      <Text style={globalStyles.contentText}>
        <Text style={{ fontWeight: "bold" }}>Slogan :</Text> {PROJECT.SLOGAN}
      </Text>
      <Text style={globalStyles.contentText}>
        <Text style={{ fontWeight: "bold" }}>Version :</Text> {PROJECT.VERSION}
      </Text>
      <ModernButton variant="secondary" onPress={() => router.push("../about")}>
        Retour
      </ModernButton>
    </ScrollView>
  );
}
