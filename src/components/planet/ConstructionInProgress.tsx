import { useUser } from "../../stores/userStore";
import PlanetSection from "../PlanetSection";
import ConstructionControls from "./ConstructionControls";

/** The building being built, with what it takes to finish it sooner. */
export default function ConstructionInProgress() {
  const isBuilding = useUser((state) => state.user.activeColony.planet.construction !== null);

  if (!isBuilding) return null;

  return (
    <PlanetSection
      title="Construction en cours"
      subtitle="L'Offlinium gagné hors ligne permet de la terminer plus tôt."
    >
      <ConstructionControls />
    </PlanetSection>
  );
}
