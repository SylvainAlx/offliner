import { useOnlineStatus } from "../stores/onlineStatusStore";
import { useUser } from "../stores/userStore";
import { ABSENCE_REPORT_MIN_OFFLINE_MS } from "../utils/constants";

export function useAbsenceReport() {
  const user = useUser((state) => state.user);
  const dismiss = useUser((state) => state.dismissAbsenceReport);
  const isOnline = useOnlineStatus((state) => state.isOnline);
  const totalOfflineMs = useOnlineStatus((state) => state.totalOfflineMs);

  const report = user.getAbsenceReport(totalOfflineMs);
  // The report waits for the answer about unobserved time, which changes how
  // much of the absence is credited. Short absences keep adding up instead.
  const isOpen =
    isOnline &&
    report !== null &&
    user.periodList.unconfirmedGaps.length === 0 &&
    report.offlineMs >= ABSENCE_REPORT_MIN_OFFLINE_MS;

  return {
    isOpen,
    report,
    originOfflineMs: user.absence?.offlineMsAtStart ?? 0,
    dismiss,
  };
}
