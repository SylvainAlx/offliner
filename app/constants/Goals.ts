export type Goal = {
  id: string;
  label: string;
  targetSeconds: number;
};

export const GOALS: Goal[] = [
  // Objectifs courts
  {
    id: "goal-1",
    label: "1 minute hors ligne – Une respiration",
    targetSeconds: 60,
  },
  {
    id: "goal-2",
    label: "10 minutes hors ligne – Une pause thé",
    targetSeconds: 600,
  },
  {
    id: "goal-3",
    label: "25 minutes hors ligne – Une session Pomodoro",
    targetSeconds: 1500,
  },
  {
    id: "goal-4",
    label: "1 heure hors ligne – Une sieste réparatrice",
    targetSeconds: 3600,
  },
  {
    id: "goal-5",
    label: "2 heures hors ligne – Temps de lecture complet",
    targetSeconds: 7200,
  },
  {
    id: "goal-6",
    label: "3 heures hors ligne – Durée d’un opéra",
    targetSeconds: 10800,
  },
  {
    id: "goal-7",
    label: "6 heures hors ligne – Une demi-journée de calme",
    targetSeconds: 21600,
  },
  {
    id: "goal-8",
    label: "12 heures hors ligne – Du coucher au lever du soleil",
    targetSeconds: 43200,
  },
  {
    id: "goal-9",
    label: "24 heures hors ligne – Une journée sans réseau",
    targetSeconds: 86400,
  },
  {
    id: "goal-10",
    label: "3 jours hors ligne – Une micro-aventure",
    targetSeconds: 3 * 86400,
  },
  {
    id: "goal-11",
    label: "7 jours hors ligne – Une retraite de silence",
    targetSeconds: 7 * 86400,
  },
  {
    id: "goal-12",
    label: "14 jours hors ligne – Une déconnexion sérieuse",
    targetSeconds: 14 * 86400,
  },
  {
    id: "goal-13",
    label: "21 jours hors ligne – Voyage intérieur",
    targetSeconds: 21 * 86400,
  },
  {
    id: "goal-14",
    label: "30 jours hors ligne – Un cycle lunaire complet",
    targetSeconds: 30 * 86400,
  },
  {
    id: "goal-15",
    label: "40 jours hors ligne – Un jeûne numérique",
    targetSeconds: 40 * 86400,
  },
  {
    id: "goal-16",
    label: "60 jours hors ligne – Un changement d’habitude",
    targetSeconds: 60 * 86400,
  },
  {
    id: "goal-17",
    label: "90 jours hors ligne – Un trimestre débranché",
    targetSeconds: 90 * 86400,
  },
  {
    id: "goal-18",
    label: "180 jours hors ligne – Une renaissance numérique",
    targetSeconds: 180 * 86400,
  },
  {
    id: "goal-19",
    label: "365 jours hors ligne – Une année complète de maîtrise",
    targetSeconds: 365 * 86400,
  },
];
