import GoalProgress from "@/components/GoalProgress";
import { GOALS } from "@/constants/Goals";
import { COLORS, SIZES } from "@/constants/Theme";
import { useOfflineProgress } from "@/contexts/OfflineProgressContext";
import { useSession } from "@/contexts/SessionContext";
import { globalStyles } from "@/styles/global.styles";
import { FlatList, Text } from "react-native";

export default function GoalsScreen() {
  const { totalSyncSeconds } = useSession();
  const { totalUnsync } = useOfflineProgress();

  return (
    <FlatList
      data={GOALS}
      keyExtractor={(item) => item.id}
      style={{ flex: 1, backgroundColor: COLORS.background }} // important ici
      contentContainerStyle={{
        padding: SIZES.padding,
        gap: SIZES.margin,
      }}
      showsVerticalScrollIndicator
      ListHeaderComponent={
        <Text style={globalStyles.title}>Objectifs hors ligne</Text>
      }
      renderItem={({ item }) => (
        <GoalProgress
          goal={item}
          totalSeconds={totalSyncSeconds + totalUnsync}
        />
      )}
    />
  );
}
