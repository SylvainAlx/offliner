import { config } from "@/config/env";
import { globalStyles } from "@/styles/global.styles";
import { Link, router } from "expo-router";
import { Text, Linking, Pressable, ScrollView } from "react-native";
import { Button } from "react-native-paper";
import { PROJECT } from "shared/config";
import { COLORS } from "shared/theme";
import { ENERGY_CONSUMPTION } from "shared/utils/powerSaving";

export default function HelpScreen() {
  const handlePress = () => {
    Linking.openURL(config.websiteUrl + "/ranking");
  };
  return (
    <ScrollView showsVerticalScrollIndicator style={globalStyles.container}>
      <Text style={globalStyles.title}>Mode d&apos;emploi</Text>
      <Text style={globalStyles.cardTitle}>Généralité</Text>
      <Text style={globalStyles.contentText}>
        L&apos;application {PROJECT.TITLE} va déclencher un minuteur au moment
        où votre téléphone est mis hors ligne, wifi et données mobiles coupés.
      </Text>
      <Text style={globalStyles.cardTitle}>Compte</Text>
      <Text style={globalStyles.contentText}>
        Pour une expérience optimale, nous vous conseillons de créer un compte
        en vous rendant sur votre{" "}
        <Link href={"../profile"} style={globalStyles.link}>
          profil
        </Link>
        . Cela vous permettra de sauvegarder vos données et de les synchroniser
        entre vos différents appareils et de miner des gemmes de temps (voir
        ci-dessous). De plus vous participerez ainsi au classement des meilleurs
        utilisateurs de l&apos;application{" "}
        <Pressable onPress={handlePress}>
          <Text style={globalStyles.link}>voir ici</Text>
        </Pressable>
      </Text>
      <Text style={globalStyles.cardTitle}>Objectifs</Text>
      <Text style={globalStyles.contentText}>
        De nombreux objectifs peuvent être atteints au fur et à mesure des
        pauses hors connexion. Vous pouvez les consulter{" "}
        <Link href={"../goals"} style={globalStyles.link}>
          ici
        </Link>
        .
      </Text>
      <Text style={globalStyles.cardTitle}>Minage de gemmes</Text>
      <Text style={globalStyles.contentText}>
        Le minage de gemmes de temps vous permet de gagner des gemmes en
        fonction de la durée de vos sessions hors ligne afin de valoriser votre
        régularité. Les regles sont les suivantes : 1 minute passée hors ligne
        puis synchronisée = 1 gemme disponible au minage. Tous les joueurs se
        partagent une mine commune. La capacité de la mine descend au fur et à
        mesure des récoltes quotidiennes. Elle augmentera lorsqu&apos;un
        utilisateur souscrira à un abonnement premium. Sa durée
        d&apos;engagement en minutes sera alors convertie en gemmes et ajoutée à
        la mine. Pour le moment seul un administrateur peut ajouter manuellement
        des gemmes à la mine.
      </Text>
      <Text style={globalStyles.cardTitle}>Énergie économisée</Text>
      <Text style={globalStyles.contentText}>
        L&apos;application calcule l&apos;économie d&apos;énergie en fonction de
        la durée totale hors ligne. L&apos;estimation est basée sur une
        consommation moyenne de {ENERGY_CONSUMPTION.WIFI}WH pour le wifi et de{" "}
        {ENERGY_CONSUMPTION.GSM}WH pour les données mobiles.
      </Text>
      <Text style={globalStyles.cardTitle}>Informations importantes</Text>
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
      <Button
        mode="contained"
        buttonColor={COLORS.secondary}
        style={globalStyles.button}
        onPress={() => router.push("../about")}
      >
        Retour
      </Button>
    </ScrollView>
  );
}
