import { GOALS } from "@/constants/Goals";
import { useOfflineProgress } from "@/contexts/OfflineProgressContext";
import { useSession } from "@/contexts/SessionContext";
import { useSyncSession } from "@/hooks/useSyncSession";
import { formatDuration } from "@/utils/formatDuration";
import { confirmDialog, showMessage } from "@/utils/formatNotification";
import { getLastOpenPeriod } from "@/utils/getOfflineTime";
import { useEffect, useRef, useState } from "react";

export const useHome = () => {
  const [since, setSince] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState<string>("0s");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { totalSyncSeconds, session, username } = useSession();
  const { syncMeasures } = useSyncSession(session);
  const { totalUnsync, isOnline } = useOfflineProgress();
  const [nextGoal, setNextGoal] = useState<(typeof GOALS)[0] | undefined>(
    undefined
  );
  const [isLoading, setIsLoading] = useState(false);

  const sendPeriods = async () => {
    if (!session) return;

    const confirmed = await confirmDialog(
      "Es-tu sûr de vouloir synchroniser les périodes non synchronisées ?"
    );

    if (!confirmed) return;
    try {
      setIsLoading(true);
      await syncMeasures();
    } catch (error) {
      if (error instanceof Error) {
        showMessage(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadStartTime = async () => {
      const now = new Date();
      const startTime = await getLastOpenPeriod(); // Assume this function fetches the start time from storage
      if (startTime) {
        setSince(new Date(startTime));
        const diff = Math.floor(
          (now.getTime() - new Date(startTime).getTime()) / 1000
        );
        setElapsed(formatDuration(diff));
      }
    };
    if (!isOnline) loadStartTime();
  }, [isOnline]);

  useEffect(() => {
    const goal = GOALS.find(
      (goal) => totalSyncSeconds + totalUnsync < goal.targetSeconds
    );
    setNextGoal(goal);
  }, [totalSyncSeconds, totalUnsync]);

  useEffect(() => {
    if (since && !isOnline) {
      intervalRef.current = setInterval(async () => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - since.getTime()) / 1000);
        setElapsed(formatDuration(diff));
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isOnline, since]);

  return {
    isOnline,
    since,
    elapsed,
    nextGoal,
    isLoading,
    sendPeriods,
    username,
    session,
    totalUnsync,
    totalSyncSeconds,
  };
};
