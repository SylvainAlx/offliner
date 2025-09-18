import { globalStyles } from "@/styles/global.styles";
import { View, Text } from "react-native";

export default function LegalsScreen() {
  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Mentions légales</Text>
      <Text style={globalStyles.contentText}>
        Ce site est une version en cours de développement. Les contenus et
        fonctionnalités sont susceptibles d’évoluer à tout moment. Nous
        déclinons toute responsabilité quant aux erreurs, bugs ou
        indisponibilités. L’utilisation de ce site se fait aux risques et périls
        de l’utilisateur.
      </Text>
    </View>
  );
}
