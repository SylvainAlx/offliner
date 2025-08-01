// app/(tabs)/account.tsx
import Account from "@/components/Account";
import Auth from "@/components/Auth";
import { useSession } from "@/contexts/SessionContext";
import { View } from "react-native";

export default function ProfileScreen() {
  const { session } = useSession();

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {session && session.user ? <Account session={session} /> : <Auth />}
    </View>
  );
}
