import { getDurationFromEnergy } from "./utils/powerSaving";

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
  // Objectifs courts
  {
    id: "Célérité",
    label: "Le temps que met la lumière du Soleil à atteindre la Terre.",
    targetSeconds: 8 * 60 + 20,
  },
  {
    id: "Mi-temps",
    label: "La durée d'une mi-temps de match de football.",
    targetSeconds: 45 * 60,
  },
  {
    id: "Dessin animé",
    label: "Durée du film 'Le Roi Lion' (1994).",
    targetSeconds: 3600 + 29 * 60,
  },
  {
    id: "Randonnée Pyréenéenne",
    label:
      "Durée de la randonnée du Lac de Gaube par le Pont d'Espagne (France).",
    targetSeconds: 2 * 3600 + 20 * 60,
  },
  {
    id: "Au lit !",
    label: "Durée moyenne de sommeil recommandée pour un adulte.",
    targetSeconds: 7 * 3600 + 30 * 60,
  },
  {
    id: "Cycle terrestre",
    label:
      "Durée que met la Terre pour faire une rotation complète sur elle-même.",
    targetSeconds: 24 * 3600,
  },

  // Objectifs longs
  {
    id: "Allo Houston",
    label: "Durée de la mission Apollo 11 vers la Lune.",
    targetSeconds: 3 * 86400 + 3 * 3600 + 49 * 60,
  },
  {
    id: "Hebdomadaire",
    label: "Durée entre deux éditions d'un magazine hebdomadaire.",
    targetSeconds: 7 * 86400,
  },
  {
    id: "TV coupée",
    label:
      "L'énergie d'un téléviseur de 50 pouces allumé pendant 1h économisée.",
    targetSeconds: getDurationFromEnergy(70), // 9 jours environ
  },
  {
    id: "Quinzaine culturelle",
    label: "Durée traditionnelle d’un festival artistique de deux semaines.",
    targetSeconds: 14 * 86400,
  },
  {
    id: "Roule Marcel !",
    label:
      "L'énergie que dépense une voiture électique pour faire 1 km économisée.",
    targetSeconds: getDurationFromEnergy(200), // 27 jours environ
  },
  {
    id: "Lunaison",
    label: "Durée moyenne d'un cycle lunaire complet.",
    targetSeconds: 29 * 86400 + 12 * 3600 + 44 * 60,
  },
  {
    id: "Bilan",
    label: "Durée d'un trimestre scolaire.",
    targetSeconds: 90 * 86400,
  },
  {
    id: "1 kWh économisé !",
    label: "L'énergie d'un petit radiateur électrique (1000W) allumé 1h.",
    targetSeconds: getDurationFromEnergy(1000), // 4 mois environ
  },
  {
    id: "Planète rouge",
    label: "Durée minimum d'un voyage aller simple vers Mars.",
    targetSeconds: 180 * 86400,
  },
  {
    id: "Bébé",
    label: "Durée moyenne d'une grossesse humaine.",
    targetSeconds: 280 * 86400,
  },
  {
    id: "Révolution",
    label:
      "Durée que met la Terre pour faire une révolution complète autour du Soleil.",
    targetSeconds: 365 * 86400,
  },
  {
    id: "Vieille Dame",
    label: "Durée de la construction de la Tour Eiffel (1887–1889).",
    targetSeconds: 774 * 86400,
  },
  {
    id: "6 kWh économisés !",
    label: "La consommation électrique moyenne d'un foyer français en 1 jour.",
    targetSeconds: getDurationFromEnergy(6000), // 2 ans et 3 mois environ
  },
];
