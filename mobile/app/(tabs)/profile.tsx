// app/(tabs)/account.tsx
import Account from "@/components/Account";
import Auth from "@/components/Auth";
import { useOfflineProgress } from "@/contexts/OfflineProgressContext";
import { useSession } from "@/contexts/SessionContext";
import { resetOfflinePeriods } from "@/services/offlineStorage";
import { globalStyles } from "@/styles/global.styles";
import { View } from "react-native";
import { COLORS } from "shared/theme";
import ModernButton from "@/components/ui/ModernButton";

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
    </View>
  );
}
