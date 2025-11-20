import { getGemPool } from "@/api/config";
import { InsertTransaction } from "@/api/transactions";
import { STORAGE_KEYS } from "@/constants/Labels";
import { useOfflineProgress } from "@/contexts/OfflineProgressContext";
import { useSession } from "@/contexts/SessionContext";
import { confirmDialog, showMessage } from "@/utils/formatNotification";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { countGemAmountFromSeconds } from "shared/utils/formatDuration";

export default function UseMining() {
  const [miningCapacity, setMiningCapacity] = useState<number | null>(null);
  const [lastMineSync, setLastMineSync] = useState<Date | null>(null);
  const [miningAvailable, setMiningAvailable] = useState<boolean>(false);
  const { dailySyncSeconds, totalGem, setTotalGem, session, deviceName } =
    useSession();
  const { isOnline } = useOfflineProgress();

  useEffect(() => {
    const fetchData = async () => {
      const result = await getGemPool();
      setMiningCapacity(parseInt(result));
      const lastSync = await AsyncStorage.getItem(
        STORAGE_KEYS.LAST_GEM_MINE_SYNC,
      );
      if (lastSync) {
        setLastMineSync(new Date(JSON.parse(lastSync)));
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const verification = () => {
      if (!lastMineSync) {
        setMiningAvailable(true);
        return;
      }
      if (lastMineSync instanceof Date) {
        if (lastMineSync.getDay() === new Date().getDay()) {
          setMiningAvailable(false);
        } else {
          setMiningAvailable(true);
        }
      }
    };
    verification();
  }, [lastMineSync]);

  const mineGem = async (gemAmount: number) => {
    const confirmed = await confirmDialog(
      `Attention, un seul minage par jour possible ! Confirmes-tu le minage de ${gemAmount} gemme(s) de temps ?`,
    );
    if (!confirmed) return;
    if (session && deviceName) {
      const result = await InsertTransaction({
        session,
        amount: countGemAmountFromSeconds(dailySyncSeconds),
        deviceName,
        type: "mining",
        direction: "out",
        target: "pool",
      });

      if (result.success) {
        showMessage("Minage réalité", "success", "Gemmes de temps");
        if (miningAvailable) {
          await AsyncStorage.setItem(
            STORAGE_KEYS.LAST_GEM_MINE_SYNC,
            JSON.stringify(new Date()),
          );
          setLastMineSync(new Date());
          setTotalGem(totalGem + gemAmount);
        }
        const newPool = await getGemPool();
        setMiningCapacity(Number(newPool));
      }
    }
  };

  return {
    miningCapacity,
    dailySyncSeconds,
    totalGem,
    lastMineSync,
    miningAvailable,
    session,
    mineGem,
    isOnline,
  };
}
