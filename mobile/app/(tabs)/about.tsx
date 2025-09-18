import { globalStyles } from "@/styles/global.styles";
import { Link } from "expo-router";
import { View, Text, Linking } from "react-native";
import { Button } from "react-native-paper";
import { OWNER, PROJECT } from "shared/config";
import { COLORS } from "shared/theme";

export default function AboutScreen() {
  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>A propos de {PROJECT.TITLE}</Text>
      <Text style={globalStyles.cardTitle}>
        Version de l&apos;application : {PROJECT.VERSION}
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
      <Button
        mode="contained"
        onPress={() => Linking.openURL(`mailto:${OWNER.CONTACT}`)}
        buttonColor={COLORS.secondary}
        style={globalStyles.button}
      >
        Contacter le développeur
      </Button>
      <Link href={"/legals"} asChild>
        <Button
          mode="contained"
          buttonColor={COLORS.secondary}
          style={globalStyles.button}
        >
          Mentions légales
        </Button>
      </Link>
    </View>
  );
}
