import { View, Text, ActivityIndicator } from "react-native";
import { globalStyles } from "@/styles/global.styles";

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
      <Text style={globalStyles.contentText}>
        {ranking.rank + (ranking.rank > 1 ? "ème" : "er")}{" "}
      </Text>
      <Text style={globalStyles.contentText}>
        {" "}
        {`sur ${ranking.total} utilisateur(s)`}
      </Text>
    </View>
  ) : (
    <ActivityIndicator />
  );
}
