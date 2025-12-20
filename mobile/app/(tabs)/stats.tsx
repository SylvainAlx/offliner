import { globalStyles } from "@/styles/global.styles";
import { ScrollView, View, Text, ActivityIndicator } from "react-native";
import { COLORS } from "shared/theme";
import { useStats } from "@/hooks/useStats";
import DigitDisplay from "@/components/DigitDisplay";
import RankingList from "@/components/RankingList";
import ModernButton from "@/components/ui/ModernButton";

export default function StatsScreen() {
  const {
    user,
    username,
    rankingWorld,
    rankingCountry,
    rankingRegion,
    rankingDepartment,
    usersRanking,
    weeklyLeagueRanking,
    openExternalLink,
  } = useStats();

  const formatDigit = (rank: number): string => {
    let exposant;
    exposant = rank === 1 ? " er" : rank >= 2 ? " ème" : "e";
    return rank + exposant;
  };

  const formatLabel = (label: string, total?: number): string => {
    return total ? `${label} (${total} utilisateurs)` : label;
  };

  return (
    <ScrollView
      contentContainerStyle={globalStyles.container}
      showsVerticalScrollIndicator
    >
      <Text style={globalStyles.title}>Classement de {username}</Text>
      <View style={globalStyles.card}>
        <Text style={globalStyles.cardTitle}>Classement général</Text>
        {rankingWorld ? (
          <DigitDisplay
            digit={formatDigit(rankingWorld.rank)}
            label={formatLabel("Monde", rankingWorld.total)}
            color={COLORS.accent}
          />
        ) : (
          <ActivityIndicator />
        )}
        {rankingCountry ? (
          <DigitDisplay
            digit={formatDigit(rankingCountry.rank)}
            label={formatLabel(user?.country ?? "", rankingCountry.total)}
            color={COLORS.accent}
          />
        ) : (
          <ActivityIndicator />
        )}
        {rankingRegion ? (
          <DigitDisplay
            digit={formatDigit(rankingRegion.rank)}
            label={formatLabel(user?.region ?? "", rankingRegion.total)}
            color={COLORS.accent}
          />
        ) : (
          <ActivityIndicator />
        )}
        {rankingDepartment ? (
          <DigitDisplay
            digit={formatDigit(rankingDepartment.rank)}
            label={formatLabel(user?.subregion ?? "", rankingDepartment.total)}
            color={COLORS.accent}
          />
        ) : (
          <ActivityIndicator />
        )}
        <Text style={globalStyles.cardTitle}>Top 10 mondial</Text>
        {usersRanking ? (
          <RankingList
            users={usersRanking}
            currentUsername={username ?? undefined}
          />
        ) : (
          <ActivityIndicator />
        )}
        <Text style={globalStyles.cardTitle}>Top 10 hebdomadaire (ligue)</Text>
        {weeklyLeagueRanking ? (
          <RankingList
            users={weeklyLeagueRanking}
            currentUsername={username ?? undefined}
          />
        ) : (
          <ActivityIndicator />
        )}
      </View>
      <View style={globalStyles.buttonContainer}>
        <ModernButton
          variant="secondary"
          onPress={openExternalLink}
          icon="open-in-new"
        >
          Consulter le classement complet
        </ModernButton>
      </View>
    </ScrollView>
  );
}
