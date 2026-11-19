import { BUILDINGS } from "../models/building";
import { COMPANION_STAGE_LABELS } from "../models/companion";
import type { VillageEvent } from "../models/timeline";

export interface DescribedEvent {
  icon: string;
  text: string;
}

/** A short sentence for an event of the village, in the report or projection. */
export function describeVillageEvent(event: VillageEvent): DescribedEvent {
  switch (event.kind) {
    case "building": {
      const definition = BUILDINGS[event.type];
      return {
        icon: definition.icon,
        text:
          definition.maxLevel === 1
            ? `${definition.label} : construction terminée`
            : `${definition.label} : niveau ${event.level}`,
      };
    }
    case "companionArrived":
      return {
        icon: "🐾",
        text: `${event.name ?? "Un nouveau compagnon"} rejoint le village`,
      };
    case "companionStage": {
      const name = event.name ?? "Un nouveau compagnon";
      if (event.stage === "dead") return { icon: "🪦", text: `${name} s'éteint` };
      return {
        icon: "✨",
        text: `${name} devient ${COMPANION_STAGE_LABELS[event.stage].toLowerCase()}`,
      };
    }
  }
}
