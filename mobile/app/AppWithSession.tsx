import { OfflineProgressProvider } from "@/contexts/OfflineProgressContext";
import { useSession } from "@/contexts/SessionContext";
import { useSyncSession } from "@/hooks/useSyncSession";
import { Stack } from "expo-router";

export default function AppWithSession() {
  const { session } = useSession();

  useSyncSession(session);

  return (
    <OfflineProgressProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </OfflineProgressProvider>
  );
}
