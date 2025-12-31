import { globalStyles } from "@/styles/global.styles";
import { router } from "expo-router";
import { View, Text, Linking } from "react-native";
import { OWNER, PROJECT } from "shared/config";
import ModernButton from "@/components/ui/ModernButton";

export default function AboutScreen() {
  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>A propos de {PROJECT.TITLE}</Text>
      <Text style={globalStyles.cardTitle}>
        Version de l&apos;application : v{PROJECT.VERSION}
      </Text>
      <Text style={globalStyles.contentText}>
        {" "}
        Dans un monde hyperconnecté, {PROJECT.TITLE} vous aide à mieux
        apréhender votre temps hors connexion en comptant précisément vos pauses
        loin du téléphone et d’internet
      </Text>
      <Text style={globalStyles.contentText}>
        Inspirée par les recommandations de la communauté scientifique
        l’application vous accompagne pour une relation plus saine avec le
        numérique et des respirations indispensables pour votre bien‑être.
      </Text>
      <Text style={globalStyles.contentText}>
        En limitant l’utilisation du Wi-Fi et des données mobiles, vous réalisez
        aussi des économies d’énergie contribuant à réduire l’empreinte carbone
        du numérique tout en allégeant vos dépenses énergétiques.
      </Text>
      <ModernButton
        variant="secondary"
        onPress={() => router.push("../help")}
        icon="book"
      >
        Mode d&apos;emploi
      </ModernButton>
      <ModernButton
        variant="secondary"
        onPress={() => Linking.openURL(`mailto:${OWNER.CONTACT}`)}
        icon="email"
      >
        Contacter le développeur
      </ModernButton>
      <ModernButton
        variant="secondary"
        onPress={() => router.push("../legals")}
        icon="file-document"
      >
        Mentions légales
      </ModernButton>
    </View>
  );
}
