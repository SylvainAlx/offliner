import { useCallback, useMemo, useState, type KeyboardEvent } from "react";
import { usePlanet, type BuildingTileData } from "../../hooks/usePlanet";
import type { BuildingType } from "../../models/buildings";
import { generateBuildingSprite } from "../../utils/buildingSprite";
import { formatCountdown } from "../../utils/format";
import type { PlanetKind } from "../../utils/planetSprite";
import { generateStarSprite, STAR_SPRITE_SIZE } from "../../utils/starSprite";
import {
  BUILDING_HEIGHT,
  BUILDING_WIDTH,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  generateSkyStars,
  generateSurfaceGround,
  getBuildingAnchor,
} from "../../utils/surfaceScene";
import { useUser } from "../../stores/userStore";
import BuildingDetailModal from "./BuildingDetailModal";

function Runs({ runs }: { runs: Array<{ x: number; y: number; width: number; color: string }> }) {
  return (
    <>
      {runs.map((run) => (
        <rect
          key={`${run.x}-${run.y}`}
          x={run.x}
          y={run.y}
          width={run.width}
          height="1"
          fill={run.color}
        />
      ))}
    </>
  );
}

function describeTile(tile: BuildingTileData): string {
  const name = tile.definition.label;
  if (tile.isUnderConstruction) return `${name}, en construction vers le niveau ${tile.nextLevel}`;
  const state = tile.level > 0 ? `niveau ${tile.level}` : "pas encore construit";
  return `${name}, ${state}${tile.blocker === null ? ", amélioration possible" : ""}`;
}

function SurfaceBuilding({
  tile,
  kind,
  remainingMs,
  onOpen,
}: {
  tile: BuildingTileData;
  kind: PlanetKind;
  remainingMs: number | null;
  onOpen: () => void;
}) {
  // A building not built yet shows what its first level will look like.
  const shownLevel = Math.max(1, tile.level);
  const sprite = useMemo(
    () => generateBuildingSprite(tile.type, shownLevel, kind, { withGround: false }),
    [tile.type, shownLevel, kind],
  );
  const anchor = getBuildingAnchor(tile.type);
  const left = anchor.x - BUILDING_WIDTH / 2;
  const top = anchor.y - BUILDING_HEIGHT;
  const isPreview = tile.level === 0 && !tile.isUnderConstruction;
  const canUpgrade = tile.blocker === null;

  function handleKeyDown(event: KeyboardEvent<SVGGElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  }

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={describeTile(tile)}
      className="group cursor-pointer outline-none"
      onClick={onOpen}
      onKeyDown={handleKeyDown}
    >
      {/* The whole spot can be tapped, label included. */}
      <rect x={left - 2} y={top - 4} width={BUILDING_WIDTH + 4} height={BUILDING_HEIGHT + 14} fill="transparent" />
      <rect
        x={left - 2}
        y={top - 4}
        width={BUILDING_WIDTH + 4}
        height={BUILDING_HEIGHT + 14}
        rx={3}
        fill="none"
        stroke="#c9a7ff"
        strokeWidth={0.8}
        className="opacity-0 transition-opacity group-hover:opacity-60 group-focus-visible:opacity-100"
      />
      <ellipse cx={anchor.x} cy={anchor.y} rx={13} ry={1.6} fill="rgba(0,0,0,0.3)" />
      <g
        transform={`translate(${left} ${top})`}
        filter={isPreview ? "url(#surface-unbuilt)" : undefined}
        opacity={isPreview ? 0.45 : tile.isUnderConstruction ? 0.8 : 1}
      >
        <Runs runs={sprite.runs} />
      </g>

      {tile.isUnderConstruction && (
        <g aria-hidden="true">
          {/* Scaffolding around the building. */}
          <g stroke="#f59e0b" strokeWidth={0.8}>
            <line x1={left + 2} y1={anchor.y} x2={left + 2} y2={top + 2} />
            <line x1={left + BUILDING_WIDTH - 2} y1={anchor.y} x2={left + BUILDING_WIDTH - 2} y2={top + 2} />
            <line x1={left + 2} y1={top + 4} x2={left + BUILDING_WIDTH - 2} y2={top + 4} />
            <line x1={left + 2} y1={top + 10} x2={left + BUILDING_WIDTH - 2} y2={top + 10} />
          </g>
        </g>
      )}

      {canUpgrade && !tile.isUnderConstruction && (
        <g aria-hidden="true">
          <circle cx={left + BUILDING_WIDTH - 2} cy={top + 1} r={3.4} fill="#16a34a" stroke="#ffffff" strokeWidth={0.6} />
          <path
            d={`M ${left + BUILDING_WIDTH - 2} ${top - 1} l 1.8 2 h -1 v 1.6 h -1.6 v -1.6 h -1 z`}
            fill="#ffffff"
          />
        </g>
      )}

      {/* The level, or the time left while the next level is being built. */}
      <g aria-hidden="true">
        <rect
          x={anchor.x - (remainingMs !== null ? 11 : 7)}
          y={anchor.y + 1.5}
          width={remainingMs !== null ? 22 : 14}
          height={6.5}
          rx={3.25}
          fill={remainingMs !== null ? "#7c3aed" : "rgba(17,24,39,0.85)"}
          stroke="rgba(255,255,255,0.35)"
          strokeWidth={0.3}
        />
        <text x={anchor.x} y={anchor.y + 6.2} textAnchor="middle" fontSize={4.2} fontWeight={700} fill="#ffffff">
          {remainingMs !== null
            ? formatCountdown(remainingMs)
            : tile.level > 0
              ? tile.level
              : "+"}
        </text>
      </g>
    </g>
  );
}

/** The planet's surface, with its buildings standing on it. */
export default function PlanetSurface() {
  const { planet, planetKind, buildings } = usePlanet();
  const now = useUser((state) => state.user.realTimeSettledAt);
  const [detail, setDetail] = useState<BuildingType | null>(null);
  const closeDetail = useCallback(() => setDetail(null), []);

  const { seed, name } = planet;
  const ground = useMemo(() => generateSurfaceGround(planetKind, seed), [planetKind, seed]);
  const stars = useMemo(() => generateSkyStars(seed), [seed]);
  // The star of the system the planet belongs to (the map is kept between ticks).
  const star = useUser((state) => state.user.getColonySystem(state.user.activeColony).star);
  const starRuns = useMemo(() => generateStarSprite(star), [star]);
  const construction = planet.construction;

  // The back row is drawn first, so that the front row stands in front of it.
  const ordered = [...buildings].sort(
    (left, right) => getBuildingAnchor(left.type).y - getBuildingAnchor(right.type).y,
  );

  return (
    <>
      <div className="w-full overflow-hidden rounded-2xl bg-[linear-gradient(180deg,#070b16_0%,#1b2a48_100%)] shadow-inner">
        <svg
          className="mx-auto block max-h-[420px] w-full overflow-visible [image-rendering:pixelated]"
          viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
          preserveAspectRatio="xMidYMax meet"
          shapeRendering="crispEdges"
          role="group"
          aria-label={`Surface de ${name} : touchez un bâtiment pour le gérer`}
        >
          <defs>
            <filter id="surface-unbuilt">
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <radialGradient id="surface-star-glow">
              <stop offset="0%" stopColor={star.colors.glow} />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          {stars.map((dot, index) => (
            <rect key={index} x={dot.x} y={dot.y} width={0.8} height={0.8} fill="#ffffff" opacity={dot.opacity} />
          ))}
          <circle cx={118} cy={13} r={12} fill="url(#surface-star-glow)" />
          <svg
            x={112}
            y={7}
            width={12}
            height={12}
            viewBox={`0 0 ${STAR_SPRITE_SIZE} ${STAR_SPRITE_SIZE}`}
            aria-hidden="true"
          >
            <Runs runs={starRuns} />
          </svg>
          <g aria-hidden="true">
            <Runs runs={ground} />
          </g>
          {ordered.map((tile) => (
            <SurfaceBuilding
              key={tile.type}
              tile={tile}
              kind={planetKind}
              remainingMs={
                construction?.type === tile.type ? Math.max(0, construction.endsAt - now) : null
              }
              onOpen={() => setDetail(tile.type)}
            />
          ))}
        </svg>
      </div>
      <p className="m-0 text-center text-[0.72rem] text-(--gray-500)">
        Touchez un bâtiment pour le construire ou l&apos;améliorer.{" "}
        <span aria-hidden="true">⬆</span> = amélioration possible.
      </p>
      <BuildingDetailModal
        type={detail}
        level={detail ? planet.levels[detail] : 0}
        onClose={closeDetail}
      />
    </>
  );
}
