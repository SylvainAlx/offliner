import { globalStyles } from "@/styles/global.styles";
import { Link } from "expo-router";
import { Text, ScrollView } from "react-native";
import { Button } from "react-native-paper";
import { COLORS } from "shared/theme";

export default function LegalsScreen() {
  return (
    <ScrollView showsVerticalScrollIndicator style={globalStyles.container}>
      <Text style={globalStyles.title}>Mentions légales</Text>

      <Text style={globalStyles.contentText}>
        Ce site est une version en cours de développement. Les contenus et
        fonctionnalités sont susceptibles d’évoluer à tout moment. Nous
        déclinons toute responsabilité quant aux erreurs, bugs ou
        indisponibilités. L’utilisation de ce site se fait aux risques de
        l’utilisateur.
      </Text>
      <Link href={"../about"} asChild>
        <Button
          mode="contained"
          buttonColor={COLORS.secondary}
          style={globalStyles.button}
        >
          Retour
        </Button>
      </Link>
    </ScrollView>
  );
}
