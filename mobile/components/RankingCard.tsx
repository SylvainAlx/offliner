import { View, Text, ActivityIndicator } from "react-native";
import { globalStyles } from "@/styles/global.styles";
import { COLORS, SIZES } from "shared/theme";

type Ranking = {
  rank: number;
  total: number;
};

interface RankingCardProps {
  title: string | null;
  ranking: Ranking | null;
}

export function RankingCard({ title, ranking }: RankingCardProps) {
  if (!title) return null;

  return ranking ? (
    <View style={globalStyles.card}>
      <Text style={globalStyles.cardTitle}>{title}</Text>
      <Text
        style={{
          fontSize: SIZES.text_lg,
          color: COLORS.primary,
          fontFamily: "Montserrat",
          fontWeight: "bold",
        }}
      >
        {ranking.rank + (ranking.rank > 1 ? "ème" : "er")}{" "}
      </Text>
      <Text
        style={{
          fontSize: SIZES.text_md,
          color: COLORS.accent,
          fontFamily: "Montserrat",
        }}
      >
        {" "}
        {`sur ${ranking.total} utilisateur(s)`}
      </Text>
    </View>
  ) : (
    <ActivityIndicator />
  );
}
