// app/(tabs)/account.tsx
import { View } from "react-native";
import { COLORS } from "shared/theme";

import Account from "@/components/sections/Account";
import Auth from "@/components/sections/Auth";
import { useOfflineProgress } from "@/contexts/OfflineProgressContext";
import { useSession } from "@/contexts/SessionContext";

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
