import { globalStyles } from "@/styles/global.styles";
import { ScrollView, View, Text } from "react-native";
import { Button } from "react-native-paper";
import { COLORS, SIZES } from "shared/theme";
import { useStats } from "@/hooks/useStats";
import { RankingCard } from "@/components/RankingCard";

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
      <Text
        style={{
          color: COLORS.accent,
          fontSize: SIZES.text_lg,
          fontFamily: "Knewave",
          textAlign: "center",
        }}
      >
        Position au classement général
      </Text>

      <Text style={globalStyles.cardTitle}>Temps passé hors ligne</Text>
      <RankingCard title="Monde" ranking={rankingWorld} />
      <RankingCard title={user?.country ?? null} ranking={rankingCountry} />
      <RankingCard title={user?.region ?? null} ranking={rankingRegion} />
      <RankingCard
        title={user?.subregion ?? null}
        ranking={rankingDepartment}
      />
      <Text style={globalStyles.cardTitle}>Collection</Text>
      <RankingCard title="Gemmes de temps" ranking={gemRanking} />
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
