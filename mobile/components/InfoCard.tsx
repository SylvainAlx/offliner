import { View, Text } from "react-native";
import { globalStyles } from "@/styles/global.styles";

interface InfoCardProps {
  title: string;
  value: string | number | null | undefined;
}

export function InfoCard({ title, value }: InfoCardProps) {
  if (value === null || value === undefined || value === "") return null;

  return (
    <View style={globalStyles.card}>
      <Text style={globalStyles.cardTitle}>{title}</Text>
      <Text style={globalStyles.contentText}>{value}</Text>
    </View>
  );
}
