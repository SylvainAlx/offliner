import { useOnlineStatus } from "../stores/onlineStatusStore";
import { useUser } from "../stores/userStore";

export function usePendingElement(){
  const totalOfflineMs = useOnlineStatus((state) => state.totalOfflineMs);
  const cancelPendingElement = useUser((state) => state.cancelPendingElement);
  return {
    totalOfflineMs,
    cancelPendingElement,
  }
}