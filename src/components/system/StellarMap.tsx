import { useMemo, type KeyboardEvent } from "react";
import type { GalaxySystem } from "../../models/starSystem";
import { LY_PER_SPACEPORT_LEVEL } from "../../models/starSystem";
import { INTERSTELLAR_BASE_LEVEL } from "../../utils/constants";
import { STAR_SPRITE_SIZE, generateStarSprite } from "../../utils/starSprite";
import { createRandom, hashSeed } from "../../utils/planetSprite";

const WIDTH = 360;
const HEIGHT = 340;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;
/**
 * Distance on the map: an offset keeps even the nearest neighbor clear of the
 * player's system, then map units per light-year up to the farthest one.
 */
const MAP_OFFSET = 32;
const MAP_UNITS_PER_LY = 18;
const STAR_SIZE = 22;

function mapRadius(distanceLy: number): number {
  return MAP_OFFSET + distanceLy * MAP_UNITS_PER_LY;
}

/** Where a system stands on the map, in its own direction. */
function mapPosition(system: GalaxySystem): { x: number; y: number } {
  if (system.isHome || system.distanceLy === 0) return { x: CENTER_X, y: CENTER_Y };
  const radius = mapRadius(system.distanceLy);
  return {
    x: CENTER_X + (system.x / system.distanceLy) * radius,
    y: CENTER_Y + (system.y / system.distanceLy) * radius,
  };
}

/** What the map shows about a system besides its star. */
export interface SystemMarker {
  isOpen: boolean;
  /** Spaceport level that would open it, when closed. */
  levelToReach: number;
  colonies: number;
}

function SystemStar({
  system,
  marker,
  isSelected,
  onSelect,
}: {
  system: GalaxySystem;
  marker: SystemMarker;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const runs = useMemo(() => generateStarSprite(system.star), [system.star]);
  const { x, y } = mapPosition(system);
  const size = system.isHome ? STAR_SIZE + 6 : STAR_SIZE;
  const label = system.isHome ? "Votre système" : system.star.name;

  function handleKeyDown(event: KeyboardEvent<SVGGElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect();
    }
  }

  return (
    <g
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`${label}${
        system.isHome ? "" : `, ${system.distanceLy.toLocaleString("fr-FR")} années-lumière`
      }${marker.isOpen ? "" : `, verrouillé : spatioport niveau ${marker.levelToReach}`}${
        marker.colonies > 0 ? `, ${marker.colonies} planète${marker.colonies > 1 ? "s" : ""} à vous` : ""
      }`}
      className="cursor-pointer outline-none [&:focus-visible>circle]:stroke-(--accent)"
      opacity={marker.isOpen || isSelected ? 1 : 0.55}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
    >
      <circle cx={x} cy={y} r={size * 0.95} fill={system.star.colors.glow} />
      <circle
        cx={x}
        cy={y}
        r={size * 0.78}
        fill="transparent"
        stroke={isSelected ? "#c9a7ff" : marker.colonies > 0 ? "#4ade80" : "transparent"}
        strokeWidth={2.5}
      />
      <svg
        x={x - size / 2}
        y={y - size / 2}
        width={size}
        height={size}
        viewBox={`0 0 ${STAR_SPRITE_SIZE} ${STAR_SPRITE_SIZE}`}
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        {runs.map((run) => (
          <rect key={`${run.x}-${run.y}`} x={run.x} y={run.y} width={run.width} height="1" fill={run.color} />
        ))}
      </svg>
      <text
        x={x}
        y={y + size * 0.78 + 12}
        textAnchor="middle"
        fontSize="10.5"
        fontWeight="700"
        fill={system.isHome ? "#4ade80" : "#e2e8f0"}
      >
        {marker.isOpen ? label : `🔒 ${label}`}
      </text>
      <text x={x} y={y + size * 0.78 + 24} textAnchor="middle" fontSize="9" fill="#94a3b8">
        {system.isHome
          ? `${system.planets.length} planètes`
          : marker.isOpen
            ? `${system.distanceLy.toLocaleString("fr-FR")} al${marker.colonies > 0 ? ` · ${marker.colonies} 🏳️` : ""}`
            : `spatioport niv. ${marker.levelToReach}`}
      </text>
    </g>
  );
}

/**
 * The player's system and its neighbors, in light-years. Rings mark how far
 * each spaceport level reaches from the player's system.
 */
export default function StellarMap({
  systems,
  markers,
  seed,
  selectedId,
  onSelect,
}: {
  systems: GalaxySystem[];
  markers: Record<string, SystemMarker>;
  seed: string;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const dots = useMemo(() => {
    const random = createRandom(hashSeed(`${seed}:stellar-map`));
    return Array.from({ length: 70 }, () => ({
      x: Math.floor(random() * WIDTH),
      y: Math.floor(random() * HEIGHT),
      opacity: 0.2 + random() * 0.5,
    }));
  }, [seed]);
  const rings = systems.slice(1).map((_, rank) => ({
    level: INTERSTELLAR_BASE_LEVEL + rank + 1,
    radius: mapRadius((rank + 1) * LY_PER_SPACEPORT_LEVEL),
  }));

  return (
    <svg
      className="block w-full rounded-2xl bg-[radial-gradient(circle_at_50%_50%,#1b2340_0%,#070b16_75%)]"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="group"
      aria-label="Carte stellaire : votre système et ses voisins"
    >
      <g aria-hidden="true">
        {dots.map((dot, index) => (
          <rect key={index} x={dot.x} y={dot.y} width={1} height={1} fill="#ffffff" opacity={dot.opacity} />
        ))}
        {rings.map((ring) => (
          <g key={ring.level}>
            <circle
              cx={CENTER_X}
              cy={CENTER_Y}
              r={ring.radius}
              fill="none"
              stroke="rgba(201, 167, 255, 0.22)"
              strokeDasharray="3 5"
            />
            <text
              x={CENTER_X + ring.radius * 0.7071 + 3}
              y={CENTER_Y - ring.radius * 0.7071 - 3}
              fontSize="8.5"
              fill="rgba(201, 167, 255, 0.6)"
            >
              niv. {ring.level}
            </text>
          </g>
        ))}
      </g>
      {systems.map((system) => (
        <SystemStar
          key={system.id}
          system={system}
          marker={markers[system.id]}
          isSelected={system.id === selectedId}
          onSelect={() => onSelect(system.id)}
        />
      ))}
    </svg>
  );
}
