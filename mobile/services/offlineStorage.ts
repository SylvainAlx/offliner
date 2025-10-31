import { STORAGE_KEYS } from "@/constants/Labels";
import { OfflinePeriod } from "../types/OfflinePeriod";
import { config } from "@/config/env";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { confirmDialog } from "@/utils/formatNotification";

// Récupérer les périodes
async function getPeriods(): Promise<OfflinePeriod[]> {
  const json = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_PERIODS);
  return json ? JSON.parse(json) : [];
}

// Ajouter une période
export async function addPeriod(period: OfflinePeriod) {
  const data = await getPeriods();
  data.push(period);
  await AsyncStorage.setItem(
    STORAGE_KEYS.OFFLINE_PERIODS,
    JSON.stringify(data),
  );
}

// Fermer la dernière période
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
    const index = reversed.indexOf(last);
    if (index !== -1) reversed.splice(index, 1);
  }

  await AsyncStorage.setItem(
    STORAGE_KEYS.OFFLINE_PERIODS,
    JSON.stringify(reversed.reverse()),
  );
}

// Supprimer les périodes non fermées
export async function deleteUnclosePeriods() {
  const data = await getPeriods();
  const updated = data.filter((period) => period.to);
  await AsyncStorage.setItem(
    STORAGE_KEYS.OFFLINE_PERIODS,
    JSON.stringify(updated),
  );
}

// Récupérer les périodes non synchronisées
export async function getUnsyncedPeriods(): Promise<OfflinePeriod[]> {
  return await getPeriods();
}

// Supprimer une période spécifique
export async function clearPeriod(index: number) {
  const periods = await getUnsyncedPeriods();
  periods.splice(index, 1);
  await AsyncStorage.setItem(
    STORAGE_KEYS.OFFLINE_PERIODS,
    JSON.stringify(periods),
  );
}

// supprimer toutes les périodes
export async function clearAllPeriods() {
  const confirmed = await confirmDialog(
    `Es-tu sûr de vouloir supprimer toutes les périodes non synchronisées ?`,
  );

  if (!confirmed) return;
  await AsyncStorage.removeItem(STORAGE_KEYS.OFFLINE_PERIODS);
}
