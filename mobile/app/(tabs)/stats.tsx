import { globalStyles } from "@/styles/global.styles";
import { ScrollView, View, Text, ActivityIndicator } from "react-native";
import { Button } from "react-native-paper";
import { COLORS } from "shared/theme";
import { useStats } from "@/hooks/useStats";
import DigitDisplay from "@/components/DigitDisplay";

export default function StatsScreen() {
  const {
    user,
    username,
    gemRanking,
    rankingWorld,
    rankingCountry,
    rankingRegion,
    rankingDepartment,
    openExternalLink,
  } = useStats();

  return (
    <ScrollView
      contentContainerStyle={globalStyles.container}
      showsVerticalScrollIndicator
    >
      <Text style={globalStyles.title}>Classement de {username}</Text>
      <View style={globalStyles.card}>
        <Text style={globalStyles.cardTitle}>Temps passé hors ligne</Text>
        {rankingWorld ? (
          <DigitDisplay
            digit={rankingWorld.rank + " / " + rankingWorld.total}
            label="Monde"
            color={COLORS.accent}
          />
        ) : (
          <ActivityIndicator />
        )}
        {rankingCountry ? (
          <DigitDisplay
            digit={rankingCountry.rank + " / " + rankingCountry.total}
            label={user?.country ?? ""}
            color={COLORS.accent}
          />
        ) : (
          <ActivityIndicator />
        )}
        {rankingRegion ? (
          <DigitDisplay
            digit={rankingRegion.rank + " / " + rankingRegion.total}
            label={user?.region ?? ""}
            color={COLORS.accent}
          />
        ) : (
          <ActivityIndicator />
        )}
        {rankingDepartment ? (
          <DigitDisplay
            digit={rankingDepartment.rank + " / " + rankingDepartment.total}
            label={user?.subregion ?? ""}
            color={COLORS.accent}
          />
        ) : (
          <ActivityIndicator />
        )}
      </View>
      <View style={globalStyles.card}>
        <Text style={globalStyles.cardTitle}>Assiduité</Text>
        <DigitDisplay digit="à venir" label="Ligue" color={COLORS.warning} />
        <DigitDisplay
          digit="à venir"
          label="Position ligue"
          color={COLORS.warning}
        />
        {gemRanking ? (
          <DigitDisplay
            digit={gemRanking.rank + " / " + gemRanking.total}
            label="Gemmes de temps"
            color={COLORS.accent}
          />
        ) : (
          <ActivityIndicator />
        )}
      </View>
      <View style={globalStyles.buttonContainer}>
        <Button
          mode="contained"
          buttonColor={COLORS.secondary}
          onPress={openExternalLink}
          style={globalStyles.button}
        >
          Consulter le classement général
        </Button>
      </View>
    </ScrollView>
  );
}
