import { useMemo } from "react";
import { useOnlineStatus } from "../stores/onlineStatusStore";
import { useUser } from "../stores/userStore";

export function useTracking() {
  const lastChecked = useOnlineStatus((state) => state.lastChecked);
  const periodList = useUser((state) => state.user.periodList);

  const now = lastChecked ? lastChecked.getTime() : 0;
  const { completedDays, openPeriod } = useMemo(
    () => ({
      completedDays: periodList.days,
      openPeriod: periodList.getOpenPeriod(),
    }),
    [periodList],
  );

  return {
    completedDays,
    openPeriod,
    now,
  };
}
