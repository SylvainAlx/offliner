import { useOnlineStatus } from "../stores/onlineStatusStore";
import { useUser } from "../stores/userStore";

export function useOffliniumBadge() {
  const isOnline = useOnlineStatus((state) => state.isOnline);
  const totalOfflineMs = useOnlineStatus((state) => state.totalOfflineMs);
  const user = useUser((state) => state.user);
  const currentOfflinium = user.getAvailableOfflinium(totalOfflineMs);

  return { isOnline, currentOfflinium };
}
