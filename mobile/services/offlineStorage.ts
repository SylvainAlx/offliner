import { STORAGE_KEYS } from "@/constants/Labels";
import { OfflinePeriod, UnsyncStats } from "../types/TypOffline";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { confirmDialog, showMessage } from "@/utils/formatNotification";
import { config } from "@/config/env";

export async function getLastOpenPeriod(): Promise<Date | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_PERIODS);
    const list = raw ? JSON.parse(raw) : [];
    const last = list[list.length - 1];
    if (last && last.start && !last.end) {
      return new Date(last.start);
    }
  } catch (error) {
    if (error instanceof Error) {
      showMessage(error.message, "error", "Erreur");
    }
  }
  return null;
}

export async function getUnsyncStats(): Promise<UnsyncStats> {
  const periods = await getPeriods();
  let total = 0;
  let weekly = 0;
  let daily = 0;

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  // Lundi comme premier jour de la semaine
  const startOfWeek = new Date(now);
  const day = now.getDay(); // 0=dimanche, 1=lundi, etc.
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  startOfWeek.setDate(now.getDate() + diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  for (const p of periods) {
    if (!p?.from) continue;

    const start = new Date(p.from).getTime();
    const end = p.to ? new Date(p.to).getTime() : Date.now();
    const duration = Math.floor((end - start) / 1000);

    total += duration;

    if (end > startOfWeek.getTime()) {
      const overlapStart = Math.max(start, startOfWeek.getTime());
      const overlapEnd = end;
      weekly += Math.floor((overlapEnd - overlapStart) / 1000);
    }

    if (end > startOfDay.getTime()) {
      const overlapStart = Math.max(start, startOfDay.getTime());
      const overlapEnd = end;
      daily += Math.floor((overlapEnd - overlapStart) / 1000);
    }
  }

  return { total, weekly, daily };
}

// Récupérer les périodes
export async function getPeriods(): Promise<OfflinePeriod[]> {
  const json = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_PERIODS);
  if (!json) return [];

  let data: OfflinePeriod[];
  try {
    data = JSON.parse(json) as OfflinePeriod[];
  } catch {
    console.warn("Invalid AsyncStorage data, clearing...");
    await AsyncStorage.removeItem(STORAGE_KEYS.OFFLINE_PERIODS);
    return [];
  }

  // Vérifie le format de chaque item
  return data.filter(
    (p: OfflinePeriod) =>
      p.from && new Date(p.from).toString() !== "Invalid Date",
  );
}

// Ajout d'une période
export async function addPeriod(period: OfflinePeriod) {
  const periods = await getPeriods();
  periods.push(period);
  await AsyncStorage.setItem(
    STORAGE_KEYS.OFFLINE_PERIODS,
    JSON.stringify(periods),
  );
}

// cloture d'une période
export async function closeLastPeriod(to?: string) {
  const periods = await getPeriods();
  const reversed = [...periods].reverse();

  function deleteElement(element: OfflinePeriod) {
    const index = reversed.indexOf(element);
    if (index !== -1) reversed.splice(index, 1);
  }

  const last = reversed.find((p) => !p.to);
  if (!last || !last.from) return;

  if (to) {
    const duration = new Date(to).getTime() - new Date(last.from).getTime();
    if (duration >= config.minimumDurationMs) {
      last.to = to;
    } else {
      deleteElement(last);
    }
  } else {
    deleteElement(last);
  }

  await AsyncStorage.setItem(
    STORAGE_KEYS.OFFLINE_PERIODS,
    JSON.stringify(reversed.reverse()),
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
