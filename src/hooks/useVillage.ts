import { useOnlineStatus } from "../stores/onlineStatusStore";

export function useVillage() {
  const isOnline = useOnlineStatus((state) => state.isOnline);

  return {
    isOnline
  };
}
