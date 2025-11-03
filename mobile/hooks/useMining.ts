import { getGemPool } from "@/api/config";
import { STORAGE_KEYS } from "@/constants/Labels";
import { useSession } from "@/contexts/SessionContext";
import { confirmDialog, showMessage } from "@/utils/formatNotification";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

export default function UseMining() {
  const [miningCapacity, setMiningCapacity] = useState<number | null>(null);
  const [lastMineSync, setLastMineSync] = useState<Date | null>(null);
  const [miningAvailable, setMiningAvailable] = useState<boolean>(false);
  const { dailySyncSeconds, totalGem, session } = useSession();

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
      `Confirmes-tu le minage de ${gemAmount} gemmes de temps ?`,
    );

    if (!confirmed) return;
    showMessage(
      "Fonctionnalité de minage de gemmes de temps en cours de développement.",
      "info",
      "A venir",
    );

    // await AsyncStorage.removeItem(STORAGE_KEYS.LAST_GEM_MINE_SYNC);

    // if (miningAvailable) {
    //   await AsyncStorage.setItem(
    //     STORAGE_KEYS.LAST_GEM_MINE_SYNC,
    //     JSON.stringify(new Date()),
    //   );
    //   setLastMineSync(new Date());
    // } else {
    //   showMessage(
    //     "Vous ne pouvez récolter des gemmes de temps qu'une fois par jour.",
    //     "info",
    //     "Attention",
    //   );
    // }
  };

  return {
    miningCapacity,
    dailySyncSeconds,
    totalGem,
    lastMineSync,
    miningAvailable,
    session,
    mineGem,
  };
}
