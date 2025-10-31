// app/(tabs)/account.tsx
import Account from "@/components/Account";
import Auth from "@/components/Auth";
import { useOfflineProgress } from "@/contexts/OfflineProgressContext";
import { useSession } from "@/contexts/SessionContext";
import { clearAllPeriods } from "@/services/offlineStorage";
import { globalStyles } from "@/styles/global.styles";
import { View } from "react-native";
import { Button } from "react-native-paper";
import { COLORS } from "shared/theme";

export default function ProfileScreen() {
  const { session } = useSession();
  const { isOnline } = useOfflineProgress();

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {session && session.user && isOnline ? (
        <Account session={session} />
      ) : (
        <Auth />
      )}
      <View style={globalStyles.buttonContainer}>
        <Button
          mode="contained"
          buttonColor={COLORS.danger}
          onPress={async () => await clearAllPeriods()}
          style={globalStyles.button}
        >
          Vider le stockage local
        </Button>
      </View>
    </View>
  );
}
