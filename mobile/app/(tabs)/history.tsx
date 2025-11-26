import { SectionList, Text, View } from "react-native";
import { useHistory } from "@/hooks/useHistory";
import { formatDuration } from "shared/utils/formatDuration";
import { globalStyles } from "@/styles/global.styles";
import { SIZES, COLORS } from "shared/theme";
import { router } from "expo-router";
import { useSession } from "@/contexts/SessionContext";
import DigitDisplay from "@/components/DigitDisplay";
import ModernButton from "@/components/ui/ModernButton";

export default function HistoryScreen() {
  const { session } = useSession();
  const { localDailyData, syncDailyData, isOnline, refreshLists } =
    useHistory();

  const sections = [
    {
      title: "Mesures locales (non synchronisées)",
      data: localDailyData,
      emptyText: "Aucune mesure hors ligne locale.",
    },
    {
      title: "Dernières mesures synchronisées",
      data: syncDailyData,
      emptyText: "Aucune mesure hors ligne synchronisée.",
      renderHeaderExtra: () =>
        !session &&
        isOnline && (
          <ModernButton
            variant="primary"
            onPress={() => router.push("../profile")}
          >
            Se connecter
          </ModernButton>
        ),
    },
  ];

  return (
    <>
      <Text style={globalStyles.title}>Historique des mesures</Text>
      <ModernButton variant="secondary" onPress={refreshLists} icon="refresh">
        Actualiser
      </ModernButton>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.date}
        style={globalStyles.container}
        contentContainerStyle={{ gap: SIZES.margin }}
        showsVerticalScrollIndicator
        renderSectionHeader={({ section }) => (
          <View>
            <Text style={globalStyles.cardTitle}>{section.title}</Text>
            {section.renderHeaderExtra?.()}
            {section.data.length === 0 && (
              <Text
                style={[
                  globalStyles.contentText,
                  { textAlign: "center", marginVertical: SIZES.margin },
                ]}
              >
                {section.emptyText}
              </Text>
            )}
          </View>
        )}
        renderItem={({ item }) => (
          <View style={globalStyles.card}>
            <DigitDisplay
              digit={formatDuration(item.totalSeconds)}
              label={item.displayDate}
              color={COLORS.accent}
            />
          </View>
        )}
      />
    </>
  );
}
