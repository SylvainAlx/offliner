import { useUser } from "../../stores/userStore";
import PlanetSprite from "../PlanetSprite";
import { BUILDINGS } from "../../models/buildings";

/**
 * The player's planets, to choose the one shown. Hidden while there is only
 * the starting planet. A planet whose site is busy shows what is being built.
 */
export default function ColonySelector() {
  const user = useUser((state) => state.user);
  const setActiveColony = useUser((state) => state.setActiveColony);
  if (user.colonies.length <= 1) return null;

  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Vos planètes">
      {user.colonies.map((colony) => {
        const isActive = colony.id === user.activeColonyId;
        const construction = colony.planet.construction;
        const isHome = colony.id === user.homeColonyId;
        return (
          <button
            key={colony.id}
            type="button"
            aria-pressed={isActive}
            className={[
              "inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border py-1 pr-3 pl-1.5 text-[0.78rem] font-bold",
              "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--accent)",
              isActive
                ? "border-(--accent-solid) bg-(--accent-solid) text-(--on-color)"
                : "border-(--gray-200) bg-(--surface) text-(--gray-700) hover:bg-(--gray-100)",
            ].join(" ")}
            onClick={() => setActiveColony(colony.id)}
            aria-label={`${colony.planet.name}${isHome ? " (planète de départ)" : ""}, ${
              construction
                ? `chantier : ${BUILDINGS[construction.type].label}`
                : "chantier libre"
            }`}
            title={
              construction
                ? `${BUILDINGS[construction.type].label} niveau ${construction.targetLevel} en construction`
                : "Chantier libre"
            }
          >
            <PlanetSprite
              seed={colony.planet.seed}
              kind={colony.planet.kind ?? undefined}
              className="block size-6 [image-rendering:pixelated] [shape-rendering:crispEdges]"
            />
            {isHome && <span aria-hidden="true">🏠</span>}
            <span className="max-w-32 truncate">{colony.planet.name}</span>
            <span className="text-[0.75rem]" aria-hidden="true">
              {construction ? BUILDINGS[construction.type].icon : "💤"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
