import { useMemo, useState } from "react";
import Card from "./ui/Card";
import { useUser } from "../stores/userStore";
import { describeSettlement } from "../models/buildings";
import { PLANET_KIND_LABELS, generatePlanetSprite } from "../utils/planetSprite";
import PlanetSprite from "./PlanetSprite";
import ConstructionInProgress from "./planet/ConstructionInProgress";
import BuildingGrid from "./planet/BuildingGrid";
import PlanetBalance from "./planet/PlanetBalance";
import PopulationPanel from "./planet/PopulationPanel";
import PlanetLeader from "./planet/PlanetLeader";
import PlanetIdentity from "./planet/PlanetIdentity";
import PlanetSurface from "./planet/PlanetSurface";
import PlanetViewToggle, {
  loadPlanetView,
  savePlanetView,
  type PlanetView,
} from "./planet/PlanetViewToggle";

export default function Planet({ onOpenInhabitants }: { onOpenInhabitants: () => void }) {
  const planet = useUser((state) => state.user.planet);
  const kind = useMemo(() => generatePlanetSprite(planet.seed).kind, [planet.seed]);
  const [view, setView] = useState<PlanetView>(loadPlanetView);

  function changeView(next: PlanetView) {
    savePlanetView(next);
    setView(next);
  }

  return (
    <Card
      ariaLabel="Planète"
      title={planet.name}
      subtitle={`${PLANET_KIND_LABELS[kind]} · ${describeSettlement(planet.levels.habitat)} · ${planet.usedFields} / ${planet.fields} cases`}
    >
      <PlanetViewToggle view={view} onChange={changeView} />
      {view === "surface" ? (
        <PlanetSurface />
      ) : (
        <div className="grid place-items-center rounded-2xl bg-[radial-gradient(circle_at_50%_45%,#1e2a4a_0%,#0b1020_70%)] px-10 py-4 shadow-inner">
          <PlanetSprite
            seed={planet.seed}
            className="block size-36 animate-[planet-float_6s_ease-in-out_infinite] [image-rendering:pixelated] [shape-rendering:crispEdges] motion-reduce:animate-none sm:size-44"
          />
        </div>
      )}
      <PlanetLeader onOpenInhabitants={onOpenInhabitants} />
      <ConstructionInProgress />
      {view === "list" && <BuildingGrid />}
      <PopulationPanel />
      <PlanetBalance />
      <PlanetIdentity />
    </Card>
  );
}
