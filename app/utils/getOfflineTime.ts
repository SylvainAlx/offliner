import { STORAGE_KEYS } from "@/constants/Labels";
import { OfflinePeriod } from "@/types/OfflinePeriod";
import AsyncStorage from "@react-native-async-storage/async-storage";

export async function getLastOpenPeriod(): Promise<Date | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_PERIODS);
    const list = raw ? JSON.parse(raw) : [];
    const last = list[list.length - 1];
    if (last && last.start && !last.end) {
      return new Date(last.start);
    }
  } catch (e) {
    console.error("[Home] Erreur lecture créneau offline:", e);
  }
  return null;
}

async function getAllPeriods(): Promise<OfflinePeriod[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_PERIODS);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error("Erreur lors de la lecture des périodes hors ligne :", error);
    return [];
  }
}

export async function getTotalOfflineSeconds(
  takeCurrent: boolean = true
): Promise<number> {
  const periods = await getAllPeriods();

  let total = 0;
  let lastOpenIndex = -1;

  // Trouver l'index du dernier créneau sans 'to'
  for (let i = periods.length - 1; i >= 0; i--) {
    if (!periods[i].to) {
      lastOpenIndex = i;
      break;
    }
  }

  periods.forEach((period, index) => {
    const start = new Date(period.from);
    let end: Date;

    if (period.to) {
      // Créneau fermé
      end = new Date(period.to);
    } else if (index === lastOpenIndex && takeCurrent) {
      // Seul le dernier créneau ouvert est considéré comme en cours
      end = new Date();
    } else {
      // Ignorer les anciens créneaux ouverts (considérés invalides ou corrompus)
      return;
    }

    total += Math.floor((end.getTime() - start.getTime()) / 1000);
  });

  return total;
}

export async function getOfflinePeriodsByDay(): Promise<
  Record<string, number>
> {
  const periods = await getAllPeriods();

  const perDay: Record<string, number> = {};

  for (const p of periods) {
    const from = new Date(p.from);
    const to = new Date(p.to ?? new Date());

    const day = from.toISOString().split("T")[0]; // yyyy-mm-dd

    const seconds = Math.floor((to.getTime() - from.getTime()) / 1000);

    perDay[day] = (perDay[day] ?? 0) + seconds;
  }

  return perDay;
}
