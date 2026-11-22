import { useMemo, useState, type KeyboardEvent } from "react";
import Card from "../ui/Card";
import PlanetSprite from "../PlanetSprite";
import { useUser } from "../../stores/userStore";
import type { StarSystem, SystemPlanet } from "../../models/starSystem";
import type { User } from "../../models/user";
import { getDistanceAu, getSpaceportRange } from "../../models/expedition";
import ExpeditionPanel from "./ExpeditionPanel";
import ExpeditionsOverview from "./ExpeditionsOverview";
import {
  PLANET_KIND_LABELS,
  generatePlanetSprite,
} from "../../utils/planetSprite";
import { STAR_SPRITE_SIZE, generateStarSprite } from "../../utils/starSprite";
import { createRandom, hashSeed } from "../../utils/planetSprite";

const MAP_SIZE = 400;
const CENTER = MAP_SIZE / 2;
const INNER_ORBIT = 70;
const OUTER_ORBIT = 166;
const STAR_SIZE = 72;

function orbitRadius(orbit: number, count: number): number {
  if (count <= 1) return INNER_ORBIT;
  return INNER_ORBIT + (orbit * (OUTER_ORBIT - INNER_ORBIT)) / (count - 1);
}

/** Bigger planets look bigger on the map, between 32 and 48 units. */
function mapSize(planet: SystemPlanet): number {
  return Math.round(
    32 + Math.min(1, Math.max(0, (planet.fields - 80) / 160)) * 16,
  );
}

function formatAu(value: number): string {
  return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} UA`;
}

function Stars({ seed }: { seed: string }) {
  const dots = useMemo(() => {
    const random = createRandom(hashSeed(`${seed}:sky`));
    return Array.from({ length: 46 }, () => ({
      x: Math.floor(random() * MAP_SIZE),
      y: Math.floor(random() * MAP_SIZE),
      size: random() < 0.15 ? 2 : 1,
      opacity: 0.35 + random() * 0.6,
    }));
  }, [seed]);
  return (
    <g aria-hidden="true">
      {dots.map((dot, index) => (
        <rect
          key={index}
          x={dot.x}
          y={dot.y}
          width={dot.size}
          height={dot.size}
          fill="#ffffff"
          opacity={dot.opacity}
        />
      ))}
    </g>
  );
}

/** What the map shows about a planet besides its look. */
interface PlanetStatus {
  /** The player's starting planet, one of their colonies, or neither. */
  owner: "home" | "colony" | null;
  name: string;
  /** A colony ship is on its way there. */
  isEnRoute: boolean;
  /** One of the player's spaceports reaches it. */
  isReachable: boolean;
}

function getPlanetStatus(user: User, planet: SystemPlanet): PlanetStatus {
  const colony = user.getColonyAt(planet.id);
  const owner = colony ? (colony.id === user.homeColonyId ? "home" : "colony") : null;
  const isReachable =
    owner !== null ||
    user.colonies.some((port) => {
      const origin = user.getSystemPlanet(port);
      const level = port.planet.levels.spaceport;
      return (
        origin !== undefined &&
        level > 0 &&
        getDistanceAu(origin, planet) <= getSpaceportRange(level) + 1e-9
      );
    });
  return {
    owner,
    name: colony?.planet.name ?? planet.name,
    isEnRoute: user.expeditions.some(
      (item) => item.kind === "colonization" && item.targetId === planet.id,
    ),
    isReachable,
  };
}

const OWNER_COLORS = { home: "#4ade80", colony: "#67e8f9" } as const;

function MapPlanet({
  planet,
  status,
  count,
  isSelected,
  onSelect,
}: {
  planet: SystemPlanet;
  status: PlanetStatus;
  count: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const sprite = useMemo(
    () => generatePlanetSprite(planet.seed, planet.kind),
    [planet.seed, planet.kind],
  );
  const radius = orbitRadius(planet.orbit, count);
  const angle = (planet.angle * Math.PI) / 180;
  const x = CENTER + Math.cos(angle) * radius;
  const y = CENTER + Math.sin(angle) * radius;
  const size = mapSize(planet);

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
      aria-label={`${status.name}${
        status.owner === "home"
          ? " (votre planète)"
          : status.owner === "colony"
            ? " (votre colonie)"
            : status.isEnRoute
              ? " (colonisation en route)"
              : status.isReachable
                ? ""
                : " (hors de portée)"
      }`}
      aria-pressed={isSelected}
      className="cursor-pointer outline-none [&:focus-visible>circle]:stroke-(--accent)"
      opacity={status.isReachable || isSelected ? 1 : 0.45}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
    >
      {/* A larger invisible target, easier to tap. */}
      <circle cx={x} cy={y} r={size / 2 + 8} fill="transparent" />
      <circle
        cx={x}
        cy={y}
        r={size / 2 + 5}
        fill="none"
        stroke={
          isSelected
            ? "#c9a7ff"
            : status.owner
              ? OWNER_COLORS[status.owner]
              : status.isEnRoute
                ? "#c9a7ff"
                : "transparent"
        }
        strokeWidth={2}
        strokeDasharray={isSelected ? undefined : "3 3"}
      />
      <svg
        x={x - size / 2}
        y={y - size / 2}
        width={size}
        height={size}
        viewBox={`0 0 ${sprite.size} ${sprite.size}`}
        shapeRendering="crispEdges"
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
      {(status.owner || status.isEnRoute) && (
        <text
          x={x}
          y={y + size / 2 + 16}
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          fill={status.owner ? OWNER_COLORS[status.owner] : "#c9a7ff"}
        >
          {status.owner === "home"
            ? "Vous"
            : status.owner === "colony"
              ? "Colonie"
              : "En route"}
        </text>
      )}
    </g>
  );
}

function SystemMap({
  system,
  seed,
  statuses,
  selectedId,
  onSelect,
}: {
  system: StarSystem;
  seed: string;
  statuses: Record<string, PlanetStatus>;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const starRuns = useMemo(
    () => generateStarSprite(system.star),
    [system.star],
  );
  const count = system.planets.length;

  return (
    <svg
      className="block aspect-square w-full rounded-2xl bg-[radial-gradient(circle_at_50%_50%,#1e2a4a_0%,#0b1020_72%)]"
      viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}
      role="group"
      aria-label={`Carte du système ${system.star.name}`}
    >
      <Stars seed={seed} />
      {system.planets.map((planet) => (
        <circle
          key={`orbit-${planet.orbit}`}
          cx={CENTER}
          cy={CENTER}
          r={orbitRadius(planet.orbit, count)}
          fill="none"
          stroke="rgba(203, 213, 225, 0.22)"
          strokeWidth={1}
          strokeDasharray={planet.isHome ? undefined : "2 4"}
          aria-hidden="true"
        />
      ))}
      <defs>
        <radialGradient id="star-glow">
          <stop offset="0%" stopColor={system.star.colors.glow} />
          <stop offset="55%" stopColor={system.star.colors.glow} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <circle
        cx={CENTER}
        cy={CENTER}
        r={STAR_SIZE * 0.9}
        fill="url(#star-glow)"
        aria-hidden="true"
      />
      <svg
        x={CENTER - STAR_SIZE / 2}
        y={CENTER - STAR_SIZE / 2}
        width={STAR_SIZE}
        height={STAR_SIZE}
        viewBox={`0 0 ${STAR_SPRITE_SIZE} ${STAR_SPRITE_SIZE}`}
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        {starRuns.map((run) => (
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
      {system.planets.map((planet) => (
        <MapPlanet
          key={planet.id}
          planet={planet}
          status={statuses[planet.id]}
          count={count}
          isSelected={planet.id === selectedId}
          onSelect={() => onSelect(planet.id)}
        />
      ))}
    </svg>
  );
}

function PlanetDetails({
  planet,
  status,
  starName,
  onOpenPlanet,
}: {
  planet: SystemPlanet;
  status: PlanetStatus;
  starName: string;
  onOpenPlanet: () => void;
}) {
  const rows: Array<[string, React.ReactNode]> = [
    ["Type", PLANET_KIND_LABELS[planet.kind]],
    ["Taille", `${planet.fields} cases`],
    ["Distance à l'étoile", formatAu(planet.distanceAu)],
    ...(planet.isHome
      ? []
      : ([
          [
            "Distance depuis votre planète",
            formatAu(planet.distanceFromHomeAu),
          ],
        ] as Array<[string, React.ReactNode]>)),
    [
      "Température moyenne",
      `${planet.temperatureC > 0 ? "+" : ""}${planet.temperatureC} °C`,
    ],
  ];

  return (
    <section
      className="flex w-full flex-col gap-3 rounded-2xl border border-(--gray-200) bg-(--surface) p-3"
      aria-live="polite"
      aria-label={`Fiche de ${status.name}`}
    >
      <div className="flex items-center gap-3">
        <div className="grid size-20 shrink-0 place-items-center rounded-xl bg-[#0b1020]">
          <PlanetSprite
            seed={planet.seed}
            kind={planet.kind}
            className="block size-18 [image-rendering:pixelated] [shape-rendering:crispEdges]"
          />
        </div>
        <div className="min-w-0">
          <strong className="block text-[1rem] text-(--gray-900) [overflow-wrap:anywhere]">
            {status.name}
          </strong>
          <span className="block text-[0.74rem] text-(--gray-600)">
            Orbite {planet.orbit + 1} autour de {starName}
          </span>
          <div className="mt-1 flex flex-wrap gap-1">
            {status.owner && (
              <span className="rounded-full bg-green-50 px-2 py-0.5 text-[0.62rem] font-extrabold text-green-700 uppercase">
                {status.owner === "home" ? "Votre planète" : "Votre colonie"}
              </span>
            )}
            {status.isEnRoute && (
              <span className="rounded-full bg-(--accent-bg) px-2 py-0.5 text-[0.62rem] font-extrabold text-(--accent) uppercase">
                Colons en route
              </span>
            )}
            {!status.owner && (
              <span
                className={`rounded-full px-2 py-0.5 text-[0.62rem] font-extrabold uppercase ${
                  planet.isColonizable
                    ? "bg-blue-50 text-blue-700"
                    : "bg-orange-50 text-orange-700"
                }`}
              >
                {planet.isColonizable ? "Colonisable" : "Non colonisable"}
              </span>
            )}
          </div>
        </div>
      </div>

      <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[0.78rem]">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-(--gray-500)">{label}</dt>
            <dd className="m-0 font-(--mono) text-(--gray-900)">{value}</dd>
          </div>
        ))}
      </dl>

      {status.owner && (
        <button
          type="button"
          className="min-h-10 cursor-pointer rounded-[10px] border border-(--gray-200) bg-(--surface) px-3 text-[0.8rem] font-bold text-(--gray-700) hover:bg-(--gray-100)"
          onClick={onOpenPlanet}
        >
          🪐 Gérer cette planète
        </button>
      )}
      <ExpeditionPanel key={planet.id} target={planet} />
    </section>
  );
}

/** The player's star system: where the next targets will be chosen. */
export default function StarSystemView({
  onOpenPlanet,
}: {
  onOpenPlanet: (colonyId: string) => void;
}) {
  const user = useUser((state) => state.user);
  // Drawn around the starting planet, and kept between ticks.
  const system = user.system;
  const seed = user.homeColony.planet.seed;
  const statuses = Object.fromEntries(
    system.planets.map((planet) => [planet.id, getPlanetStatus(user, planet)]),
  );
  const [selectedId, setSelectedId] = useState("home");
  const selected =
    system.planets.find((item) => item.id === selectedId) ?? system.planets[0];

  return (
    <Card
      ariaLabel="Système planétaire"
      title={`Système ${system.star.name}`}
      subtitle={`${system.star.label} · ${system.planets.length} planètes. Touchez une planète pour la coloniser ou y envoyer un cargo.`}
    >
      <SystemMap
        system={system}
        seed={seed}
        statuses={statuses}
        selectedId={selected.id}
        onSelect={setSelectedId}
      />

      <div
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-label="Planètes du système"
      >
        {system.planets.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={item.id === selected.id}
            className={`min-h-9 cursor-pointer rounded-full border px-3 text-[0.75rem] font-bold focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-1 ${
              item.id === selected.id
                ? "border-(--accent-solid) bg-(--accent-solid) text-(--on-color)"
                : "border-(--gray-200) bg-(--surface) text-(--gray-700) hover:bg-(--gray-100)"
            }`}
            onClick={() => setSelectedId(item.id)}
          >
            {statuses[item.id].owner === "home"
              ? "🏠 "
              : statuses[item.id].owner === "colony"
                ? "🏳️ "
                : ""}
            {statuses[item.id].name}
          </button>
        ))}
      </div>

      <ExpeditionsOverview />

      <PlanetDetails
        planet={selected}
        status={statuses[selected.id]}
        starName={system.star.name}
        onOpenPlanet={() => {
          const colony = user.getColonyAt(selected.id);
          if (colony) onOpenPlanet(colony.id);
        }}
      />
    </Card>
  );
}
