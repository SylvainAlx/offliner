import { useState } from "react";
import { generatePlanetName } from "../models/planet";
import { generateInhabitantName } from "../models/notable";

export interface HomeScene {
  planetSeed: string;
  planetName: string;
  /** The three inhabitants standing in front, the middle one first. */
  inhabitantIds: string[];
  /** The middle inhabitant's name: they sign the sample radar signal. */
  leaderName: string;
  /** The sample radar signal's message. */
  message: string;
  drawnAt: number;
}

/** Sample messages, `{planet}` replaced by the planet's name. */
const SAMPLE_MESSAGES = [
  "Ici {planet} ! Nos fermes débordent : qui veut échanger contre du métal ? 🌾",
  "Bonjour, voisins des étoiles ! {planet} vient de lancer son premier vaisseau colonial. 🚀",
  "{planet} appelle toutes les planètes : qui a déjà atteint la mégalopole ? 🌆",
  "Belle nuit hors ligne sur {planet}. Le réacteur ronronne, la colonie dort. 🌙",
];

function drawScene(): HomeScene {
  const planetName = generatePlanetName();
  const template = SAMPLE_MESSAGES[Math.floor(Math.random() * SAMPLE_MESSAGES.length)];
  return {
    planetSeed: crypto.randomUUID(),
    planetName,
    inhabitantIds: Array.from({ length: 3 }, () => crypto.randomUUID()),
    leaderName: generateInhabitantName(),
    message: template.replace("{planet}", planetName),
    drawnAt: Date.now(),
  };
}

/** A new random planet and its inhabitants on every visit, or on demand. */
export function useHomePage() {
  const [scene, setScene] = useState(drawScene);
  return { scene, drawAnotherScene: () => setScene(drawScene()) };
}
