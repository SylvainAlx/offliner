import type { User } from "./user";

export type AchievementCategory = "Temps hors ligne" | "Régularité" | "Planète";

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  target: number;
  getProgress: (user: User, totalOfflineMs: number) => number;
}

export interface Achievement extends AchievementDefinition {
  progress: number;
  unlocked: boolean;
}

const HOUR_MS = 60 * 60 * 1000;

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: "offline-hour",
    title: "Première heure",
    description: "Cumulez une heure passée hors ligne.",
    category: "Temps hors ligne",
    icon: "⏳",
    target: HOUR_MS,
    getProgress: (_, totalOfflineMs) => totalOfflineMs,
  },
  {
    id: "offline-day",
    title: "Journée déconnectée",
    description: "Cumulez 24 heures passées hors ligne.",
    category: "Temps hors ligne",
    icon: "🌙",
    target: 24 * HOUR_MS,
    getProgress: (_, totalOfflineMs) => totalOfflineMs,
  },
  {
    id: "offline-week",
    title: "Maître du temps",
    description: "Cumulez une semaine passée hors ligne.",
    category: "Temps hors ligne",
    icon: "⌛",
    target: 7 * 24 * HOUR_MS,
    getProgress: (_, totalOfflineMs) => totalOfflineMs,
  },
  {
    id: "offline-days-three",
    title: "Régulier",
    description: "Passez hors ligne pendant trois jours différents.",
    category: "Régularité",
    icon: "📅",
    target: 3,
    getProgress: (user) => countOfflineDays(user),
  },
  {
    id: "offline-streak-seven",
    title: "Rituel quotidien",
    description: "Passez hors ligne au moins une fois pendant sept jours consécutifs.",
    category: "Régularité",
    icon: "🔥",
    target: 7,
    getProgress: (user) => getLongestOfflineStreak(user),
  },
  {
    id: "first-building",
    title: "Premières fondations",
    description: "Terminez votre premier bâtiment.",
    category: "Planète",
    icon: "🏗️",
    target: 1,
    getProgress: (user) => user.planet.totalLevels,
  },
  {
    id: "village",
    title: "Un village",
    description: "Construisez l'habitat : vos colons fondent un village.",
    category: "Planète",
    icon: "🏘️",
    target: 1,
    getProgress: (user) => user.planet.levels.habitat,
  },
  {
    id: "city",
    title: "La ville",
    description: "Faites passer l'habitat au niveau 6 : le village devient une ville.",
    category: "Planète",
    icon: "🏙️",
    target: 6,
    getProgress: (user) => user.planet.levels.habitat,
  },
  {
    id: "population-hundred",
    title: "Centaine",
    description: "Atteignez 100 habitants.",
    category: "Planète",
    icon: "👥",
    target: 100,
    getProgress: (user) => Math.floor(user.population),
  },
  {
    id: "mine-ten",
    title: "Filon profond",
    description: "Montez la mine de métal au niveau 10.",
    category: "Planète",
    icon: "⛏️",
    target: 10,
    getProgress: (user) => user.planet.levels.metalMine,
  },
  {
    id: "spaceport",
    title: "Vers les étoiles",
    description: "Construisez le spatioport et découvrez votre système planétaire.",
    category: "Planète",
    icon: "🚀",
    target: 1,
    getProgress: (user) => user.planet.levels.spaceport,
  },
  {
    id: "laboratory",
    title: "Esprit scientifique",
    description: "Construisez le laboratoire.",
    category: "Planète",
    icon: "🔬",
    target: 1,
    getProgress: (user) => user.planet.levels.laboratory,
  },
];

export function getAchievements(
  user: User,
  totalOfflineMs: number,
): Achievement[] {
  return ACHIEVEMENT_DEFINITIONS.map((definition) => {
    const progress = Math.max(0, definition.getProgress(user, totalOfflineMs));
    return {
      ...definition,
      progress: Math.min(definition.target, progress),
      unlocked: progress >= definition.target,
    };
  });
}

function countOfflineDays(user: User): number {
  return user.periodList.days.filter((day) => day.durationMs > 0).length;
}

function getLongestOfflineStreak(user: User): number {
  const activeDays = new Set(
    user.periodList.days
      .filter((day) => day.durationMs > 0)
      .map((day) => getDayKey(day.dayStart)),
  );
  let longest = 0;

  for (const dayKey of activeDays) {
    if (activeDays.has(getPreviousDayKey(dayKey))) continue;

    let streak = 1;
    let nextDayKey = getNextDayKey(dayKey);
    while (activeDays.has(nextDayKey)) {
      streak += 1;
      nextDayKey = getNextDayKey(nextDayKey);
    }
    longest = Math.max(longest, streak);
  }

  return longest;
}

function getDayKey(timestamp: number): string {
  const date = new Date(timestamp);
  return [
    date.getFullYear().toString().padStart(4, "0"),
    (date.getMonth() + 1).toString().padStart(2, "0"),
    date.getDate().toString().padStart(2, "0"),
  ].join("-");
}

function shiftDayKey(dayKey: string, amount: number): string {
  const [year, month, day] = dayKey.split("-").map(Number);
  const date = new Date(year, month - 1, day + amount);
  return getDayKey(date.getTime());
}

function getPreviousDayKey(dayKey: string): string {
  return shiftDayKey(dayKey, -1);
}

function getNextDayKey(dayKey: string): string {
  return shiftDayKey(dayKey, 1);
}
