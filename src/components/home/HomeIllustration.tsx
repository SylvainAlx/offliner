import { useMemo } from "react";
import { generateStarSystem } from "../../models/starSystem";
import type { BuildingType } from "../../models/buildings";
import { generateBuildingSprite } from "../../utils/buildingSprite";
import { generateCompanionSprite } from "../../utils/companionSprite";
import { PLANET_KIND_LABELS, generatePlanetSprite } from "../../utils/planetSprite";
import { generateStarSprite, STAR_SPRITE_SIZE } from "../../utils/starSprite";
import {
  BUILDING_HEIGHT,
  BUILDING_WIDTH,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  generateSkyStars,
  generateSurfaceGround,
  surfaceY,
} from "../../utils/surfaceScene";
import type { HomeScene } from "../../hooks/useHomePage";

type Run = { x: number; y: number; width: number; color: string };

function Runs({ runs }: { runs: Run[] }) {
  return (
    <>
      {runs.map((run) => (
        <rect key={`${run.x}-${run.y}`} x={run.x} y={run.y} width={run.width} height="1" fill={run.color} />
      ))}
    </>
  );
}

/** The village in the back: where the inhabitants live and work. */
const BUILDINGS: Array<{ type: BuildingType; level: number; x: number }> = [
  { type: "habitat", level: 4, x: 30 },
  { type: "farm", level: 2, x: 106 },
];

/** The inhabitants in front: x of their feet center, ground depth, size. */
const INHABITANTS = [
  { x: 68, depth: 52, size: 30, delay: "0s" },
  { x: 40, depth: 45, size: 24, delay: "-0.8s" },
  { x: 96, depth: 46, size: 25, delay: "-1.6s" },
];

function Inhabitant({ id, x, y, size, delay }: { id: string; x: number; y: number; size: number; delay: string }) {
  const sprite = useMemo(() => generateCompanionSprite(id), [id]);
  return (
    <g>
      <ellipse cx={x} cy={y} rx={size * 0.32} ry={1.4} fill="rgba(0,0,0,0.28)" />
      <g
        className="animate-[home-hop_2.4s_ease-in-out_infinite] motion-reduce:animate-none"
        style={{ animationDelay: delay }}
      >
        <svg
          x={x - size / 2}
          // The sprites keep a little room under the feet: sit them on the ground.
          y={y - size + (size * 3) / 16}
          width={size}
          height={size}
          viewBox={`0 0 ${sprite.size} ${sprite.size}`}
        >
          {sprite.pixels.map((pixel) => (
            <rect key={`${pixel.x}-${pixel.y}`} x={pixel.x} y={pixel.y} width="1" height="1" fill={pixel.color} />
          ))}
        </svg>
      </g>
    </g>
  );
}

/**
 * The welcome scene, in the style of the planet's surface view: a random
 * planet, its star and a neighbor in the sky, its village and three of its
 * inhabitants. A new planet is drawn on every visit.
 */
export default function HomeIllustration({
  scene,
  onDrawAnother,
}: {
  scene: HomeScene;
  onDrawAnother: () => void;
}) {
  const { planetSeed: seed, planetName: name, inhabitantIds } = scene;
  const kind = useMemo(() => generatePlanetSprite(seed).kind, [seed]);
  const ground = useMemo(() => generateSurfaceGround(kind, seed), [kind, seed]);
  const stars = useMemo(() => generateSkyStars(seed), [seed]);
  const system = useMemo(() => generateStarSystem({ seed, name, fields: 163 }), [seed, name]);
  const starRuns = useMemo(() => generateStarSprite(system.star), [system]);
  // A real neighbor from the planet's own system rises behind the horizon.
  const neighbor = useMemo(() => {
    const others = system.planets.filter((planet) => !planet.isHome);
    return others.find((planet) => planet.kind === "gas") ?? others[others.length - 1];
  }, [system]);
  const neighborSprite = useMemo(
    () => (neighbor ? generatePlanetSprite(neighbor.seed, neighbor.kind) : null),
    [neighbor],
  );
  const buildings = useMemo(
    () => BUILDINGS.map((building) => ({ ...building, sprite: generateBuildingSprite(building.type, building.level, kind, { withGround: false }) })),
    [kind],
  );

  return (
    <div className="relative min-h-82.5 overflow-hidden rounded-[28px] border border-[rgba(170,59,255,0.22)] bg-[linear-gradient(180deg,#070b16_0%,#1b2a48_100%)] shadow-[0_18px_40px_rgba(65,18,100,0.18)] max-[760px]:mb-2 max-[760px]:min-h-63.75 max-[760px]:max-w-125 max-[430px]:min-h-57.5">
      <svg
        className="absolute inset-0 block size-full [image-rendering:pixelated]"
        viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
        preserveAspectRatio="xMidYMax slice"
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="home-star-glow">
            <stop offset="0%" stopColor={system.star.colors.glow} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        {stars.map((dot, index) => (
          <rect
            key={index}
            x={dot.x}
            y={dot.y}
            width={0.8}
            height={0.8}
            fill="#ffffff"
            opacity={dot.opacity}
            className={index % 6 === 0 ? "animate-[dotBlink_3s_ease-in-out_infinite] motion-reduce:animate-none" : undefined}
            style={index % 6 === 0 ? { animationDelay: `${-(index % 5) * 0.6}s` } : undefined}
          />
        ))}
        <circle cx={116} cy={12} r={13} fill="url(#home-star-glow)" />
        <svg x={109} y={5} width={14} height={14} viewBox={`0 0 ${STAR_SPRITE_SIZE} ${STAR_SPRITE_SIZE}`}>
          <Runs runs={starRuns} />
        </svg>
        {neighborSprite && (
          <g className="animate-[planet-float_8s_ease-in-out_infinite] motion-reduce:animate-none">
            <svg x={-2} y={3} width={46} height={46} viewBox={`0 0 ${neighborSprite.size} ${neighborSprite.size}`}>
              <Runs runs={neighborSprite.runs} />
            </svg>
          </g>
        )}
        <Runs runs={ground} />
        {buildings.map((building) => (
          <svg
            key={building.type}
            x={building.x - BUILDING_WIDTH / 2}
            y={Math.round(surfaceY(building.x) + 17) - BUILDING_HEIGHT}
            width={BUILDING_WIDTH}
            height={BUILDING_HEIGHT}
            viewBox={`0 0 ${building.sprite.width} ${building.sprite.height}`}
          >
            <Runs runs={building.sprite.runs} />
          </svg>
        ))}
        {/* The middle inhabitant is drawn last, in front of the two others. */}
        {[1, 2, 0].map((index) => {
          const spot = INHABITANTS[index];
          const id = inhabitantIds[index];
          if (!id) return null;
          return (
            <Inhabitant
              key={id}
              id={id}
              x={spot.x}
              y={Math.round(surfaceY(spot.x) + spot.depth)}
              size={spot.size}
              delay={spot.delay}
            />
          );
        })}
      </svg>

      <span className="absolute bottom-3 left-3 z-1 rounded-full bg-black/45 px-2.5 py-1 text-[0.7rem] font-bold text-[#ffffff] backdrop-blur-sm">
        🪐 {name} · {PLANET_KIND_LABELS[kind]}
      </span>
      <button
        type="button"
        className="absolute right-3 bottom-3 z-1 grid size-9 cursor-pointer place-items-center rounded-full border border-white/20 bg-black/40 text-[1rem] backdrop-blur-sm transition-transform hover:rotate-12 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffffff]"
        onClick={onDrawAnother}
        aria-label="Afficher une autre planète"
        title="Une autre planète"
      >
        🎲
      </button>
    </div>
  );
}
