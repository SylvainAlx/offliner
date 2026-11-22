import { useState } from "react";
import { generatePlanetName } from "../models/planet";

export interface HomeScene {
  planetSeed: string;
  planetName: string;
  /** The three inhabitants standing in front, the middle one first. */
  inhabitantIds: string[];
}

function drawScene(): HomeScene {
  return {
    planetSeed: crypto.randomUUID(),
    planetName: generatePlanetName(),
    inhabitantIds: Array.from({ length: 3 }, () => crypto.randomUUID()),
  };
}

/** A new random planet and its inhabitants on every visit, or on demand. */
export function useHomePage() {
  const [scene, setScene] = useState(drawScene);
  return { scene, drawAnotherScene: () => setScene(drawScene()) };
}
