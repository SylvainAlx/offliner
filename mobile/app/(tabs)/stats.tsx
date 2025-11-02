import { globalStyles } from "@/styles/global.styles";
import { ScrollView, View, Text } from "react-native";
import { Button } from "react-native-paper";
import { COLORS, SIZES } from "shared/theme";
import { useStats } from "@/hooks/useStats";
import { RankingCard } from "@/components/RankingCard";
import { InfoCard } from "@/components/InfoCard";

export default function StatsScreen() {
  const {
    date,
    user,
    username,
    rankingWorld,
    rankingCountry,
    rankingRegion,
    rankingDepartment,
    devices,
    openExternalLink,
  } = useStats();

  return (
    <ScrollView
      contentContainerStyle={globalStyles.container}
      showsVerticalScrollIndicator
    >
      <Text style={globalStyles.title}>Statistiques de {username}</Text>
      <Text
        style={{
          color: COLORS.accent,
          fontSize: SIZES.text_lg,
          fontFamily: "Knewave",
          textAlign: "center",
        }}
      >
        Classement personnel
      </Text>

      <RankingCard title="Monde" ranking={rankingWorld} />
      <RankingCard title={user?.country ?? null} ranking={rankingCountry} />
      <RankingCard title={user?.region ?? null} ranking={rankingRegion} />
      <RankingCard
        title={user?.subregion ?? null}
        ranking={rankingDepartment}
      />
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
      <Text
        style={{
          color: COLORS.accent,
          fontSize: SIZES.text_lg,
          fontFamily: "Knewave",
          textAlign: "center",
        }}
      >
        Autres informations
      </Text>
      <InfoCard title="Appareil utilisé" value={devices} />
      <InfoCard
        title="Date d'inscription"
        value={date ? new Date(date).toLocaleDateString() : null}
      />
    </ScrollView>
  );
}
