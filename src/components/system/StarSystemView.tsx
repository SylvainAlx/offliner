import { useMemo, useState, type KeyboardEvent } from "react";
import Card from "../ui/Card";
import PlanetSprite from "../PlanetSprite";
import { useUser } from "../../stores/userStore";
import {
  ABUNDANCE_LABELS,
  generateStarSystem,
  type Abundance,
  type StarSystem,
  type SystemPlanet,
} from "../../models/starSystem";
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

function MapPlanet({
  planet,
  count,
  isSelected,
  onSelect,
}: {
  planet: SystemPlanet;
  count: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const sprite = useMemo(
    () => generatePlanetSprite(planet.seed),
    [planet.seed],
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
      aria-label={`${planet.name}${planet.isHome ? " (votre planète)" : ""}`}
      aria-pressed={isSelected}
      className="cursor-pointer outline-none [&:focus-visible>circle]:stroke-(--accent)"
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
          isSelected ? "#c9a7ff" : planet.isHome ? "#4ade80" : "transparent"
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
      {planet.isHome && (
        <text
          x={x}
          y={y + size / 2 + 16}
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          fill="#4ade80"
        >
          Vous
        </text>
      )}
    </g>
  );
}

function SystemMap({
  system,
  seed,
  selectedId,
  onSelect,
}: {
  system: StarSystem;
  seed: string;
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
          count={count}
          isSelected={planet.id === selectedId}
          onSelect={() => onSelect(planet.id)}
        />
      ))}
    </svg>
  );
}

function AbundanceMeter({ value }: { value: Abundance }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex gap-0.5" aria-hidden="true">
        {[1, 2, 3].map((step) => (
          <span
            key={step}
            className={`inline-block h-2.5 w-2 rounded-[2px] ${
              step <= value ? "bg-(--green-primary)" : "bg-(--gray-200)"
            }`}
          />
        ))}
      </span>
      {ABUNDANCE_LABELS[value]}
    </span>
  );
}

function PlanetDetails({
  planet,
  starName,
}: {
  planet: SystemPlanet;
  starName: string;
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
    ["Métal", <AbundanceMeter key="metal" value={planet.metal} />],
    ["Fertilité", <AbundanceMeter key="fertility" value={planet.fertility} />],
  ];

  return (
    <section
      className="flex flex-col gap-3 rounded-2xl border border-(--gray-200) bg-(--surface) p-3"
      aria-live="polite"
      aria-label={`Fiche de ${planet.name}`}
    >
      <div className="flex items-center gap-3">
        <div className="grid size-20 shrink-0 place-items-center rounded-xl bg-[#0b1020]">
          <PlanetSprite
            seed={planet.seed}
            className="block size-18 [image-rendering:pixelated] [shape-rendering:crispEdges]"
          />
        </div>
        <div className="min-w-0">
          <strong className="block text-[1rem] text-(--gray-900) [overflow-wrap:anywhere]">
            {planet.name}
          </strong>
          <span className="block text-[0.74rem] text-(--gray-600)">
            Orbite {planet.orbit + 1} autour de {starName}
          </span>
          <div className="mt-1 flex flex-wrap gap-1">
            {planet.isHome && (
              <span className="rounded-full bg-green-50 px-2 py-0.5 text-[0.62rem] font-extrabold text-green-700 uppercase">
                Votre planète
              </span>
            )}
            <span
              className={`rounded-full px-2 py-0.5 text-[0.62rem] font-extrabold uppercase ${
                planet.isColonizable
                  ? "bg-blue-50 text-blue-700"
                  : "bg-orange-50 text-orange-700"
              }`}
            >
              {planet.isColonizable ? "Colonisable" : "Non colonisable"}
            </span>
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

      {!planet.isHome && (
        <div className="flex flex-col gap-1">
          <button
            type="button"
            className="min-h-10 cursor-not-allowed rounded-[10px] border border-dashed border-(--accent-border) bg-(--accent-bg) px-3 text-[0.8rem] font-bold text-(--accent) opacity-70"
            disabled
          >
            🚀 Lancer une expédition
          </button>
          <span className="text-center text-[0.7rem] text-(--gray-500)">
            Les expéditions arriveront dans une prochaine version.
          </span>
        </div>
      )}
    </section>
  );
}

/** The player's star system: where the next targets will be chosen. */
export default function StarSystemView() {
  // Only what the system depends on: the planet object changes every second.
  const seed = useUser((state) => state.user.planet.seed);
  const name = useUser((state) => state.user.planet.name);
  const fields = useUser((state) => state.user.planet.fields);
  const system = useMemo(
    () => generateStarSystem({ seed, name, fields }),
    [seed, name, fields],
  );
  const [selectedId, setSelectedId] = useState("home");
  const selected =
    system.planets.find((item) => item.id === selectedId) ?? system.planets[0];

  return (
    <Card
      ariaLabel="Système planétaire"
      title={`Système ${system.star.name}`}
      subtitle={`${system.star.label} · ${system.planets.length} planètes. Touchez une planète pour voir ses caractéristiques.`}
    >
      <SystemMap
        system={system}
        seed={seed}
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
            {item.isHome ? "🏠 " : ""}
            {item.name}
          </button>
        ))}
      </div>

      <PlanetDetails planet={selected} starName={system.star.name} />
    </Card>
  );
}
