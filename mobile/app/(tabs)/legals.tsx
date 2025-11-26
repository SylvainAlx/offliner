import { globalStyles } from "@/styles/global.styles";
import { router } from "expo-router";
import { Text, ScrollView } from "react-native";
import { COLORS } from "shared/theme";
import ModernButton from "@/components/ui/ModernButton";

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
      <ModernButton variant="secondary" onPress={() => router.push("../about")}>
        Retour
      </ModernButton>
    </ScrollView>
  );
}
