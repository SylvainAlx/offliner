import type { User } from "./user";
import type { BuildingType } from "./buildings";

export type AchievementCategory =
  | "Planète"
  | "Exploration spatiale"
  | "Habitants"
  | "Temps hors ligne"
  | "Régularité";

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

const DAY_MS = 24 * HOUR_MS;

/** Highest level of a building among the player's planets. */
const bestLevel = (user: User, type: BuildingType) =>
  user.maxOverColonies((colony) => colony.planet.levels[type]);
const totalPopulation = (user: User) =>
  Math.floor(user.sumOverColonies((colony) => colony.population));
const colonyCount = (user: User) => user.colonies.length - 1;

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // --- Planète ---------------------------------------------------------------
  {
    id: "first-building",
    title: "Premières fondations",
    description: "Terminez votre premier bâtiment.",
    category: "Planète",
    icon: "🏗️",
    target: 1,
    getProgress: (user) => user.sumOverColonies((colony) => colony.planet.totalLevels),
  },
  {
    id: "village",
    title: "Un village",
    description: "Construisez l'habitat : vos colons fondent un village.",
    category: "Planète",
    icon: "🏘️",
    target: 1,
    getProgress: (user) => bestLevel(user, "habitat"),
  },
  {
    id: "laboratory",
    title: "Esprit scientifique",
    description: "Construisez le laboratoire.",
    category: "Planète",
    icon: "🔬",
    target: 1,
    getProgress: (user) => bestLevel(user, "laboratory"),
  },
  {
    id: "city",
    title: "La ville",
    description: "Faites passer l'habitat au niveau 6 : le village devient une ville.",
    category: "Planète",
    icon: "🏙️",
    target: 6,
    getProgress: (user) => bestLevel(user, "habitat"),
  },
  {
    id: "population-hundred",
    title: "Centaine",
    description: "Atteignez 100 habitants, toutes planètes confondues.",
    category: "Planète",
    icon: "👥",
    target: 100,
    getProgress: totalPopulation,
  },
  {
    id: "mine-ten",
    title: "Filon profond",
    description: "Montez la mine de métal au niveau 10.",
    category: "Planète",
    icon: "⛏️",
    target: 10,
    getProgress: (user) => bestLevel(user, "metalMine"),
  },
  {
    id: "farm-ten",
    title: "Greniers pleins",
    description: "Montez la ferme au niveau 10.",
    category: "Planète",
    icon: "🌾",
    target: 10,
    getProgress: (user) => bestLevel(user, "farm"),
  },
  {
    id: "reactor-ten",
    title: "Cœur nucléaire",
    description: "Montez le réacteur au niveau 10.",
    category: "Planète",
    icon: "⚡",
    target: 10,
    getProgress: (user) => bestLevel(user, "reactor"),
  },
  {
    id: "builder",
    title: "Bâtisseur",
    description: "Cumulez 50 niveaux de bâtiments sur vos planètes.",
    category: "Planète",
    icon: "🧱",
    target: 50,
    getProgress: (user) => user.sumOverColonies((colony) => colony.planet.totalLevels),
  },
  {
    id: "population-five-hundred",
    title: "Cité florissante",
    description: "Atteignez 500 habitants, toutes planètes confondues.",
    category: "Planète",
    icon: "🎉",
    target: 500,
    getProgress: totalPopulation,
  },
  {
    id: "academy",
    title: "Académie des sciences",
    description: "Montez le laboratoire au niveau 5.",
    category: "Planète",
    icon: "🎓",
    target: 5,
    getProgress: (user) => bestLevel(user, "laboratory"),
  },
  {
    id: "metropolis",
    title: "Mégalopole",
    description: "Faites passer l'habitat au niveau 11 : la ville devient une mégalopole.",
    category: "Planète",
    icon: "🌆",
    target: 11,
    getProgress: (user) => bestLevel(user, "habitat"),
  },
  {
    id: "population-thousand",
    title: "Mille âmes",
    description: "Atteignez 1 000 habitants, toutes planètes confondues.",
    category: "Planète",
    icon: "🌍",
    target: 1000,
    getProgress: totalPopulation,
  },
  {
    id: "mine-twenty",
    title: "Noyau planétaire",
    description: "Montez la mine de métal au niveau 20.",
    category: "Planète",
    icon: "🌋",
    target: 20,
    getProgress: (user) => bestLevel(user, "metalMine"),
  },
  {
    id: "architect",
    title: "Architecte planétaire",
    description: "Cumulez 150 niveaux de bâtiments sur vos planètes.",
    category: "Planète",
    icon: "📐",
    target: 150,
    getProgress: (user) => user.sumOverColonies((colony) => colony.planet.totalLevels),
  },

  // --- Exploration spatiale ------------------------------------------------
  {
    id: "spaceport",
    title: "Vers les étoiles",
    description: "Construisez le spatioport et découvrez votre système planétaire.",
    category: "Exploration spatiale",
    icon: "🚀",
    target: 1,
    getProgress: (user) => bestLevel(user, "spaceport"),
  },
  {
    id: "first-expedition",
    title: "Premier envol",
    description: "Lancez votre première expédition.",
    category: "Exploration spatiale",
    icon: "🛫",
    target: 1,
    getProgress: (user) => user.stats.expeditionsLaunched,
  },
  {
    id: "first-colony",
    title: "Nouveau monde",
    description: "Fondez votre première colonie.",
    category: "Exploration spatiale",
    icon: "🏳️",
    target: 1,
    getProgress: colonyCount,
  },
  {
    id: "first-cargo",
    title: "Ligne commerciale",
    description: "Livrez un premier cargo à l'une de vos planètes.",
    category: "Exploration spatiale",
    icon: "📦",
    target: 1,
    getProgress: (user) => user.stats.cargoDeliveries,
  },
  {
    id: "distant-city",
    title: "Ville lointaine",
    description: "Faites grandir une colonie jusqu'à la ville (habitat niveau 6).",
    category: "Exploration spatiale",
    icon: "🌃",
    target: 6,
    getProgress: (user) =>
      user.maxOverColonies((colony) =>
        colony.id === user.homeColonyId ? 0 : colony.planet.levels.habitat,
      ),
  },
  {
    id: "expeditions-twenty-five",
    title: "Flotte rodée",
    description: "Lancez 25 expéditions.",
    category: "Exploration spatiale",
    icon: "🛸",
    target: 25,
    getProgress: (user) => user.stats.expeditionsLaunched,
  },
  {
    id: "space-bridge",
    title: "Pont spatial",
    description: "Livrez 50 000 unités de métal et d'alimentation par cargo.",
    category: "Exploration spatiale",
    icon: "🌉",
    target: 50_000,
    getProgress: (user) => user.stats.cargoUnitsDelivered,
  },
  {
    id: "full-range",
    title: "Portée maximale",
    description: "Montez un spatioport au niveau 6 : tout le système est à portée.",
    category: "Exploration spatiale",
    icon: "🔭",
    target: 6,
    getProgress: (user) => bestLevel(user, "spaceport"),
  },
  {
    id: "star-empire",
    title: "Empire stellaire",
    description: "Possédez 3 colonies en plus de votre planète de départ.",
    category: "Exploration spatiale",
    icon: "🌌",
    target: 3,
    getProgress: colonyCount,
  },

  // --- Habitants -------------------------------------------------------------
  {
    id: "leader-story",
    title: "Biographe",
    description: "Donnez un nom, un titre et une histoire à votre chef planétaire.",
    category: "Habitants",
    icon: "👑",
    target: 1,
    getProgress: (user) => (user.getLeader(user.homeColonyId)?.isCustomized ? 1 : 0),
  },
  {
    id: "first-notable",
    title: "Habitant de la semaine",
    description: "Accueillez votre premier habitant de la semaine.",
    category: "Habitants",
    icon: "⭐",
    target: 1,
    getProgress: (user) => user.weeklyNotables.length,
  },
  {
    id: "chronicler",
    title: "Chroniqueur",
    description: "Racontez l'histoire de 10 habitants de la semaine.",
    category: "Habitants",
    icon: "📜",
    target: 10,
    getProgress: (user) => user.weeklyNotables.filter((notable) => notable.isCustomized).length,
  },
  {
    id: "colony-memory",
    title: "Mémoire de la colonie",
    description: "Accueillez 52 habitants de la semaine : une année entière.",
    category: "Habitants",
    icon: "🏛️",
    target: 52,
    getProgress: (user) => user.weeklyNotables.length,
  },

  // --- Temps hors ligne ------------------------------------------------------
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
    target: DAY_MS,
    getProgress: (_, totalOfflineMs) => totalOfflineMs,
  },
  {
    id: "offline-week",
    title: "Maître du temps",
    description: "Cumulez une semaine passée hors ligne.",
    category: "Temps hors ligne",
    icon: "⌛",
    target: 7 * DAY_MS,
    getProgress: (_, totalOfflineMs) => totalOfflineMs,
  },
  {
    id: "offline-month",
    title: "Ermite numérique",
    description: "Cumulez 30 jours passés hors ligne.",
    category: "Temps hors ligne",
    icon: "🏔️",
    target: 30 * DAY_MS,
    getProgress: (_, totalOfflineMs) => totalOfflineMs,
  },
  {
    id: "offline-hundred-days",
    title: "Légende déconnectée",
    description: "Cumulez 100 jours passés hors ligne.",
    category: "Temps hors ligne",
    icon: "🗿",
    target: 100 * DAY_MS,
    getProgress: (_, totalOfflineMs) => totalOfflineMs,
  },

  // --- Régularité ------------------------------------------------------------
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
    id: "offline-days-thirty",
    title: "Habitué",
    description: "Passez hors ligne pendant 30 jours différents.",
    category: "Régularité",
    icon: "🗓️",
    target: 30,
    getProgress: (user) => countOfflineDays(user),
  },
  {
    id: "offline-streak-thirty",
    title: "Un mois sans faille",
    description: "Passez hors ligne au moins une fois pendant 30 jours consécutifs.",
    category: "Régularité",
    icon: "💪",
    target: 30,
    getProgress: (user) => getLongestOfflineStreak(user),
  },
  {
    id: "offline-days-hundred",
    title: "Centenaire",
    description: "Passez hors ligne pendant 100 jours différents.",
    category: "Régularité",
    icon: "💯",
    target: 100,
    getProgress: (user) => countOfflineDays(user),
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
