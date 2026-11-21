import { useMemo } from "react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import BuildingSprite from "../BuildingSprite";
import { useUser } from "../../stores/userStore";
import { BUILDINGS, getBuildingCost } from "../../models/buildings";
import { formatResources } from "../../models/resources";
import { generatePlanetSprite } from "../../utils/planetSprite";
import { formatCountdown } from "../../utils/format";

/** Shown in place of the star system until the spaceport is built. */
export default function SystemLocked({ onGoToPlanet }: { onGoToPlanet: () => void }) {
  const seed = useUser((state) => state.user.planet.seed);
  const construction = useUser((state) => state.user.planet.construction);
  const now = useUser((state) => state.user.realTimeSettledAt);
  const kind = useMemo(() => generatePlanetSprite(seed).kind, [seed]);
  const isBuilding = construction?.type === "spaceport";

  return (
    <Card
      ariaLabel="Système planétaire verrouillé"
      title="Système planétaire"
      subtitle="Construisez le spatioport pour découvrir les planètes voisines."
    >
      <div className="mx-auto w-full max-w-72">
        <BuildingSprite type="spaceport" level={1} kind={kind} isPreview={!isBuilding} />
      </div>
      <p className="m-0 text-center text-[0.85rem] leading-normal text-(--gray-600)">
        {isBuilding
          ? `Le spatioport est en construction : prêt dans ${formatCountdown(construction.endsAt - now)}.`
          : `Le spatioport ouvre l'accès à votre système planétaire, d'où partiront les futures expéditions. Il coûte ${formatResources(getBuildingCost("spaceport", 1))} au niveau 1.`}
      </p>
      <div className="flex justify-center">
        <Button onClick={onGoToPlanet}>
          {BUILDINGS.spaceport.icon} Aller aux bâtiments
        </Button>
      </div>
    </Card>
  );
}
