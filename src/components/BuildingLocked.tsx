import { useMemo } from "react";
import Card from "./ui/Card";
import Button from "./ui/Button";
import BuildingSprite from "./BuildingSprite";
import { useActiveColony, useUser } from "../stores/userStore";
import { getPlanetKind } from "../models/planet";
import { BUILDINGS, getBuildingCost, type BuildingType } from "../models/buildings";
import { formatResources } from "../models/resources";
import { formatCountdown } from "../utils/format";

/** Shown in place of a section until the building that opens it exists. */
export default function BuildingLocked({
  type,
  title,
  subtitle,
  purpose,
  onGoToPlanet,
}: {
  type: BuildingType;
  title: string;
  subtitle: string;
  /** What the building opens, as a sentence. */
  purpose: string;
  onGoToPlanet: () => void;
}) {
  const planet = useActiveColony().planet;
  const construction = planet.construction;
  const now = useUser((state) => state.user.realTimeSettledAt);
  const kind = useMemo(
    () => getPlanetKind({ seed: planet.seed, kind: planet.kind }),
    [planet.seed, planet.kind],
  );
  const isBuilding = construction?.type === type;
  const label = BUILDINGS[type].label;

  return (
    <Card ariaLabel={`${title} verrouillé`} title={title} subtitle={subtitle}>
      <div className="mx-auto w-full max-w-72">
        <BuildingSprite type={type} level={1} kind={kind} isPreview={!isBuilding} />
      </div>
      <p className="m-0 text-center text-[0.85rem] leading-normal text-(--gray-600)">
        {isBuilding
          ? `${label} en construction : prêt dans ${formatCountdown(construction.endsAt - now)}.`
          : `${purpose} Il coûte ${formatResources(getBuildingCost(type, 1))} au niveau 1.`}
      </p>
      <div className="flex justify-center">
        <Button onClick={onGoToPlanet}>{BUILDINGS[type].icon} Aller aux bâtiments</Button>
      </div>
    </Card>
  );
}
