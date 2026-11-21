import { useMemo } from "react";
import type { BuildingType } from "../models/buildings";
import type { PlanetKind } from "../utils/planetSprite";
import { PLANET_SKIES, generateBuildingSprite } from "../utils/buildingSprite";

interface BuildingSpriteProps {
  type: BuildingType;
  level: number;
  kind: PlanetKind;
  /** Not built yet: shown faded. */
  isPreview?: boolean;
}

/** A building in pixel art, on the ground and under the sky of its planet. */
export default function BuildingSprite({ type, level, kind, isPreview = false }: BuildingSpriteProps) {
  const sprite = useMemo(
    () => generateBuildingSprite(type, level, kind),
    [type, level, kind],
  );

  return (
    <div
      className="w-full overflow-hidden rounded-lg"
      style={{ background: PLANET_SKIES[kind] }}
    >
      <svg
        className={`block aspect-[32/20] w-full [image-rendering:pixelated] [shape-rendering:crispEdges] ${
          isPreview ? "opacity-45 grayscale" : ""
        }`}
        viewBox={`0 0 ${sprite.width} ${sprite.height}`}
        aria-hidden="true"
      >
        {sprite.runs.map((run) => (
          <rect
            key={`${run.x}-${run.y}`}
            x={run.x}
            y={run.y}
            width={run.width}
            height="1"
            fill={run.color}
          />
        ))}
      </svg>
    </div>
  );
}
