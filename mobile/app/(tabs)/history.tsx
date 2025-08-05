import { getAllMeasures } from "@/api/measures";
import { COLORS, SIZES } from "@/constants/Theme";
import { useSession } from "@/contexts/SessionContext";
import { globalStyles } from "@/styles/global.styles";
import { Button } from "@rneui/themed";
import { Session } from "@supabase/supabase-js";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";

type DailySummary = {
  date: string;
  displayDate: string;
  totalSeconds: number;
};

export default function HistoryScreen() {
  const [dailyData, setDailyData] = useState<DailySummary[]>([]);
  const { session } = useSession();

  const loadSlots = async (session: Session) => {
    const raw = await getAllMeasures(session);
    if (!raw) return;

    const grouped = raw.reduce<Record<string, number>>((acc, item: any) => {
      const dayKey = format(parseISO(item.date), "yyyy-MM-dd");
      acc[dayKey] = (acc[dayKey] || 0) + (item.duration || 0);
      return acc;
    }, {});

    const summaries: DailySummary[] = Object.entries(grouped)
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([date, totalSeconds]) => ({
        date,
        displayDate: format(parseISO(date), "EEEE d MMMM yyyy", {
          locale: fr,
        }),
        totalSeconds,
      }));

    setDailyData(summaries);
  };

  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  useEffect(() => {
    if (session) loadSlots(session);
  }, [session]);

  return (
    <FlatList
      data={dailyData}
      keyExtractor={(item) => item.date}
      style={{ flex: 1, backgroundColor: COLORS.background }}
      contentContainerStyle={{
        padding: SIZES.padding,
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
            />
          ) : (
            <Link href={"/profile"} asChild>
              <Button
                title="Se connecter"
                color={COLORS.primary}
                radius={100}
                style={globalStyles.button}
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
            ⏱️ Total : {formatDuration(item.totalSeconds)}
          </Text>
        </View>
      )}
    />
  );
}
