import { COLORS, SIZES } from "shared/theme";
import { useSession } from "@/contexts/SessionContext";
import { globalStyles } from "@/styles/global.styles";
import { FlatList, Text, View } from "react-native";
import { Button } from "react-native-paper";
import { Link } from "expo-router";
import React from "react";
import { useHistory } from "@/hooks/useHistory";
import { formatDuration } from "shared/utils/formatDuration";

export default function HistoryScreen() {
  const { session } = useSession();
  const { dailyData, loadSlots } = useHistory();

  const renderHeader = () => (
    <>
      <Text style={globalStyles.title}>
        Historique des mesures synchronisées
      </Text>
      {dailyData.length === 0 && (
        <Text
          style={[
            globalStyles.contentText,
            { textAlign: "center", marginVertical: SIZES.margin },
          ]}
        >
          Aucune mesure hors ligne enregistrée.
        </Text>
      )}

      {session ? (
        <Button
          mode="contained"
          onPress={() => session && loadSlots(session)}
          buttonColor={COLORS.secondary}
          style={globalStyles.button}
        >
          Actualiser
        </Button>
      ) : (
        <Link href={"/profile"} asChild>
          <Button
            mode="contained"
            buttonColor={COLORS.secondary}
            style={globalStyles.button}
          >
            Se connecter
          </Button>
        </Link>
      )}
    </>
  );

  return (
    <FlatList
      data={dailyData}
      keyExtractor={(item) => item.date}
      style={globalStyles.container}
      contentContainerStyle={{ gap: SIZES.margin }}
      showsVerticalScrollIndicator
      ListHeaderComponent={renderHeader}
      renderItem={({ item }) => (
        <View style={globalStyles.card}>
          <Text style={globalStyles.cardTitle}>
            📅 {item.totalSeconds > 86400 && "à partir du "} {item.displayDate}
          </Text>
          <Text style={globalStyles.contentText}>
            Total : {formatDuration(item.totalSeconds)}
          </Text>
        </View>
      )}
    />
  );
}
