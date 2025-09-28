import { config } from "@/config/env";
import { globalStyles } from "@/styles/global.styles";
import { Link } from "expo-router";
import { Text, Linking, Pressable, ScrollView } from "react-native";
import { Button } from "react-native-paper";
import { PROJECT } from "shared/config";
import { COLORS } from "shared/theme";

export default function HelpScreen() {
  const handlePress = () => {
    Linking.openURL(config.websiteUrl + "/ranking");
  };
  return (
    <ScrollView showsVerticalScrollIndicator style={globalStyles.container}>
      <Text style={globalStyles.title}>Mode d&apos;emploi</Text>
      <Text style={globalStyles.contentText}>
        L&apos;application {PROJECT.TITLE} va déclencher un minuteur au moment
        où votre téléphone est mis hors ligne, wifi et données mobiles coupés.
      </Text>
      <Text style={globalStyles.contentText}>
        De nombreux objectifs peuvent être atteints au fur et à mesure des
        pauses hors connexion. Vous pouvez les consulter{" "}
        <Link href={"../goals"} style={globalStyles.link}>
          ici
        </Link>
        .
      </Text>
      <Text style={globalStyles.contentText}>
        Pour une expérience optimale, nous vous conseillons de créer un compte
        en vous rendant sur votre{" "}
        <Link href={"../profile"} style={globalStyles.link}>
          profil
        </Link>
        . Cela vous permettra de sauvegarder vos données et de les synchroniser
        entre vos différents appareils. De plus vous participerez ainsi au
        classement des meilleurs utilisateurs de l&apos;application{" "}
        <Pressable onPress={handlePress}>
          <Text style={globalStyles.link}>voir ici</Text>
        </Pressable>
      </Text>
      <Text style={globalStyles.contentText}>
        L&apos;application {PROJECT.TITLE} présente également certaines limites
        techniques. En effet, pour fonctionner correctement, elle doit rester
        active en arrière-plan. De plus, le minuteur peut être interrompu par
        d&apos;autre applications prioritaires.
      </Text>
      <Text style={globalStyles.contentText}>
        Le minuteur est programmé pour ne pas se lancer entre minuit et 6h du
        matin afin de favoriser la déconnexion sur les temps d&apos;éveil.
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
