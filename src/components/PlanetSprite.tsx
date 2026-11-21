import { useMemo } from "react";
import { generatePlanetSprite } from "../utils/planetSprite";

interface PlanetSpriteProps {
  seed: string;
  className?: string;
}

/** The planet drawn in pixel art from its seed, always the same. */
export default function PlanetSprite({ seed, className }: PlanetSpriteProps) {
  const sprite = useMemo(() => generatePlanetSprite(seed), [seed]);

  return (
    <svg
      className={
        className ??
        "block size-36 [image-rendering:pixelated] [shape-rendering:crispEdges]"
      }
      viewBox={`0 0 ${sprite.size} ${sprite.size}`}
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
  );
}
