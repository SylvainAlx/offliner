import { SectionList, Text, View } from "react-native";
import { useHistory } from "@/hooks/useHistory";
import { formatDuration } from "shared/utils/formatDuration";
import { globalStyles } from "@/styles/global.styles";
import { SIZES, COLORS } from "shared/theme";
import { Button } from "react-native-paper";
import { router } from "expo-router";
import { useSession } from "@/contexts/SessionContext";

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
      title: "Mesures synchronisées",
      data: syncDailyData,
      emptyText: "Aucune mesure hors ligne synchronisée.",
      renderHeaderExtra: () =>
        !session &&
        isOnline && (
          <Button
            mode="contained"
            buttonColor={COLORS.secondary}
            style={globalStyles.button}
            onPress={() => router.push("../profile")}
          >
            Se connecter
          </Button>
        ),
    },
  ];

  return (
    <>
      <Text style={globalStyles.title}>Historique des mesures</Text>
      <Button
        mode="contained"
        onPress={refreshLists}
        buttonColor={COLORS.secondary}
        style={globalStyles.button}
      >
        Actualiser
      </Button>
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
            <Text style={globalStyles.cardTitle}>
              📅 {item.totalSeconds > 86400 && "à partir du "}{" "}
              {item.displayDate}
            </Text>
            <Text style={globalStyles.contentText}>
              Total : {formatDuration(item.totalSeconds)}
            </Text>
          </View>
        )}
      />
    </>
  );
}
