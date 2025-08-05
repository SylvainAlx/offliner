import { config } from "@/config/env";
import { STORAGE_KEYS } from "@/constants/Labels";
import { showMessage } from "@/utils/formatNotification";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OfflinePeriod } from "../types/OfflinePeriod";

export async function getPeriods(): Promise<OfflinePeriod[]> {
  const json = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_PERIODS);
  return json ? JSON.parse(json) : [];
}

export async function addPeriod(period: OfflinePeriod) {
  const data = await getPeriods();
  data.push(period);
  await AsyncStorage.setItem(
    STORAGE_KEYS.OFFLINE_PERIODS,
    JSON.stringify(data)
  );
}

export async function closeLastPeriod(to: string) {
  const data = await getPeriods();
  const reversed = [...data].reverse();
  const last = reversed.find((p) => !p.to);

  if (!last || !last.from) return;

  const fromDate = new Date(last.from);
  const toDate = new Date(to);
  const duration = toDate.getTime() - fromDate.getTime();

  if (duration >= config.minimumDurationMs) {
    last.to = to;
  } else {
    // Supprimer la période si elle est trop courte
    const index = reversed.indexOf(last);
    if (index !== -1) reversed.splice(index, 1);
  }

  // Sauvegarder les données dans le bon ordre
  await AsyncStorage.setItem(
    STORAGE_KEYS.OFFLINE_PERIODS,
    JSON.stringify(reversed.reverse())
  );
  showMessage("cloture de la mesure hors ligne");
}

export async function deleteUnclosePeriods() {
  const data = await getPeriods();
  const updated = data.filter((period) => period.to);
  await AsyncStorage.setItem(
    STORAGE_KEYS.OFFLINE_PERIODS,
    JSON.stringify(updated)
  );
}

export async function getUnsyncedPeriods(): Promise<OfflinePeriod[]> {
  return await getPeriods();
}

export async function clearPeriod(index: number) {
  const periods = await getUnsyncedPeriods();
  periods.splice(index, 1);
  await AsyncStorage.setItem(
    STORAGE_KEYS.OFFLINE_PERIODS,
    JSON.stringify(periods)
  );
}
