import { globalStyles } from "@/styles/global.styles";
import { ScrollView, View, Text } from "react-native";
import { Button } from "react-native-paper";
import { COLORS, SIZES } from "shared/theme";
import { formatDuration } from "shared/utils/formatDuration";
import { useStats } from "@/hooks/useStats";
import { getPowerSavingEstimate } from "shared/utils/powerSaving";
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
    totalSyncSeconds,
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
        Classement
      </Text>
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
      <RankingCard title="Monde" ranking={rankingWorld} />
      <RankingCard title={user?.country ?? null} ranking={rankingCountry} />
      <RankingCard title={user?.region ?? null} ranking={rankingRegion} />
      <RankingCard
        title={user?.subregion ?? null}
        ranking={rankingDepartment}
      />
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
      <InfoCard
        title="Temps passé hors-ligne"
        value={formatDuration(totalSyncSeconds)}
      />
      <InfoCard
        title="Économie d'énergie estimée"
        value={getPowerSavingEstimate(totalSyncSeconds)}
      />
      <InfoCard title="Appareil utilisé" value={devices} />
      <InfoCard
        title="Date d'inscription"
        value={date ? new Date(date).toLocaleDateString() : null}
      />
    </ScrollView>
  );
}
