import { COLORS, SIZES } from "shared/theme";
import { useSession } from "@/contexts/SessionContext";
import { globalStyles } from "@/styles/global.styles";
import { Button } from "@rneui/themed";
import { Link } from "expo-router";
import React from "react";
import { FlatList, Text, View } from "react-native";
import { useHistory } from "@/hooks/useHistory";
import { formatDuration } from "shared/utils/formatDuration";

export default function HistoryScreen() {
  const { session } = useSession();
  const { dailyData, loadSlots } = useHistory();

  return (
    <FlatList
      data={dailyData}
      keyExtractor={(item) => item.date}
      style={globalStyles.container}
      contentContainerStyle={{
        gap: SIZES.margin,
      }}
      showsVerticalScrollIndicator
      ListHeaderComponent={
        <>
          <Text style={globalStyles.title}>
            Historique des mesures synchronisées
          </Text>
          {dailyData.length === 0 && (
            <Text style={[globalStyles.contentText, { textAlign: "center" }]}>
              Aucune mesure hors ligne enregistrée.
            </Text>
          )}
          {session ? (
            <Button
              title="Actualiser"
              onPress={() => session && loadSlots(session)}
              color={COLORS.primary}
              radius={100}
              style={globalStyles.button}
              titleStyle={{ color: COLORS.dark }}
            />
          ) : (
            <Link href={"/profile"} asChild>
              <Button
                title="Se connecter"
                color={COLORS.primary}
                radius={100}
                style={globalStyles.button}
                titleStyle={{ color: COLORS.dark }}
              />
            </Link>
          )}
        </>
      }
      renderItem={({ item }) => (
        <View style={globalStyles.card}>
          <Text style={globalStyles.cardTitle}>
            📅 {item.totalSeconds > 86400 && "à partir du "}
            {item.displayDate}
          </Text>
          <Text style={globalStyles.contentText}>
            Total : {formatDuration(item.totalSeconds)}
          </Text>
        </View>
      )}
    />
  );
}
