export type Goal = {
  id: string;
  label: string;
  targetSeconds: number;
};

export const getActiveGoal = (totalDuration: number): Goal | null => {
  // On trie les objectifs par durée décroissante
  const sortedGoals = GOALS.sort((a, b) => a.targetSeconds - b.targetSeconds);
  // On trouve le premier objectif dont la durée cible est inférieure ou égale à la durée totale
  return (
    sortedGoals.find((goal) => totalDuration <= goal.targetSeconds) || null
  );
};

export const GOALS: Goal[] = [
  // Objectifs très courts
  {
    id: "goal-1",
    label: "1 minute hors ligne – Une respiration",
    targetSeconds: 60,
  },
  {
    id: "goal-2",
    label: "5 minutes hors ligne – Se recentrer",
    targetSeconds: 5 * 60,
  },
  {
    id: "goal-3",
    label: "10 minutes hors ligne – Une pause thé",
    targetSeconds: 10 * 60,
  },
  {
    id: "goal-4",
    label: "15 minutes hors ligne – Méditation rapide",
    targetSeconds: 15 * 60,
  },
  {
    id: "goal-5",
    label: "25 minutes hors ligne – Une session Pomodoro",
    targetSeconds: 25 * 60,
  },
  {
    id: "goal-6",
    label: "30 minutes hors ligne – Petite promenade",
    targetSeconds: 30 * 60,
  },

  // Objectifs moyens
  {
    id: "goal-7",
    label: "1 heure hors ligne – Une sieste réparatrice",
    targetSeconds: 3600,
  },
  {
    id: "goal-8",
    label: "2 heures hors ligne – Temps de lecture complet",
    targetSeconds: 2 * 3600,
  },
  {
    id: "goal-9",
    label: "3 heures hors ligne – Durée d’un opéra",
    targetSeconds: 3 * 3600,
  },
  {
    id: "goal-10",
    label: "4 heures hors ligne – Atelier créatif",
    targetSeconds: 4 * 3600,
  },
  {
    id: "goal-11",
    label: "6 heures hors ligne – Une demi-journée de calme",
    targetSeconds: 6 * 3600,
  },
  {
    id: "goal-12",
    label: "8 heures hors ligne – Nuit complète de sommeil",
    targetSeconds: 8 * 3600,
  },
  {
    id: "goal-13",
    label: "12 heures hors ligne – Du coucher au lever du soleil",
    targetSeconds: 12 * 3600,
  },

  // Objectifs longs
  {
    id: "goal-14",
    label: "1 jour hors ligne – Une journée sans réseau",
    targetSeconds: 1 * 86400,
  },
  {
    id: "goal-15",
    label: "2 jours hors ligne – Retraite numérique courte",
    targetSeconds: 2 * 86400,
  },
  {
    id: "goal-16",
    label: "3 jours hors ligne – Une micro-aventure",
    targetSeconds: 3 * 86400,
  },
  {
    id: "goal-17",
    label: "5 jours hors ligne – Immersion complète",
    targetSeconds: 5 * 86400,
  },
  {
    id: "goal-18",
    label: "7 jours hors ligne – Une retraite de silence",
    targetSeconds: 7 * 86400,
  },
  {
    id: "goal-19",
    label: "10 jours hors ligne – Évasion prolongée",
    targetSeconds: 10 * 86400,
  },
  {
    id: "goal-20",
    label: "14 jours hors ligne – Une déconnexion sérieuse",
    targetSeconds: 14 * 86400,
  },
  {
    id: "goal-21",
    label: "21 jours hors ligne – Voyage intérieur",
    targetSeconds: 21 * 86400,
  },
  {
    id: "goal-22",
    label: "30 jours hors ligne – Un cycle lunaire complet",
    targetSeconds: 30 * 86400,
  },
  {
    id: "goal-23",
    label: "40 jours hors ligne – Un jeûne numérique",
    targetSeconds: 40 * 86400,
  },
  {
    id: "goal-24",
    label: "60 jours hors ligne – Un changement d’habitude",
    targetSeconds: 60 * 86400,
  },
  {
    id: "goal-25",
    label: "90 jours hors ligne – Un trimestre débranché",
    targetSeconds: 90 * 86400,
  },
  {
    id: "goal-26",
    label: "180 jours hors ligne – Une renaissance numérique",
    targetSeconds: 180 * 86400,
  },
  {
    id: "goal-27",
    label: "365 jours hors ligne – Une année complète de maîtrise",
    targetSeconds: 365 * 86400,
  },
  // Objectifs très longs
  {
    id: "goal-28",
    label: "2 ans hors ligne – Voyage introspectif majeur",
    targetSeconds: 2 * 365 * 86400,
  },
  {
    id: "goal-29",
    label: "3 ans hors ligne – Déconnexion totale prolongée",
    targetSeconds: 3 * 365 * 86400,
  },
  {
    id: "goal-30",
    label: "5 ans hors ligne – Retraite extrême",
    targetSeconds: 5 * 365 * 86400,
  },
  {
    id: "goal-31",
    label: "10 ans hors ligne – Une vie hors du réseau",
    targetSeconds: 10 * 365 * 86400,
  },
];
