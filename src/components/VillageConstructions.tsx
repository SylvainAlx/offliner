import { useVillageConstructions } from "../hooks/useVIllageConstructions";
import {
  COMPANION_INVOCATION_COST,
  HOUSE_CONSTRUCTION_COST,
  TOWN_HALL_CONSTRUCTION_COST,
} from "../utils/constants";
import PendingElement from "./PendingElement";
import VillageSection from "./VillageSection";
import { CraftTile } from "./CraftTile";

export default function VillageConstructions() {
  const {
    houses,
    townHall,
    companions,
    companionCapacity,
    canBuildHouse,
    buildHouse,
    canBuildTownHall,
    buildTownHall,
    canInvoke,
    invokeCompanion,
    pendingElements,
    pendingHouses,
    pendingTownHalls,
    renderProgress,
    pendingCompanions,
    totalOfflineMs,
    liveOfflinium,
    hasCompanionSlot,
  } = useVillageConstructions();

  return (
    <VillageSection
      title="À construire / invoquer"
      subtitle="Chaque élément avance pendant vos périodes hors ligne."
    >
      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
        <CraftTile
          elementName="Hôtel de ville"
          icon="🏛️"
          description="Débloque le nom du village et le renommage des compagnons."
          count={townHall ? 1 : 0}
          countLabel={townHall ? "Construit" : "Pas encore construit"}
          canBuild={canBuildTownHall}
          onClick={() => buildTownHall(totalOfflineMs)}
          cost={TOWN_HALL_CONSTRUCTION_COST}
          pendingElements={pendingTownHalls}
          renderProgress={renderProgress}
          liveOfflinium={liveOfflinium}
          craftTime="5 min"
          actionLabel="Construire"
        >
          {townHall
            ? "Déjà construit"
            : pendingTownHalls.length > 0
              ? "Construction en cours"
              : canBuildTownHall
                ? "Construire"
                : `Il vous manque ${TOWN_HALL_CONSTRUCTION_COST - liveOfflinium} ⬡`}
        </CraftTile>

        <CraftTile
          elementName="Maison"
          icon="🏠"
          description="Augmente la capacité de population de 4."
          count={houses.length}
          countLabel={`maison${houses.length > 1 ? "s" : ""} construite${houses.length > 1 ? "s" : ""}`}
          canBuild={canBuildHouse}
          onClick={() => buildHouse(totalOfflineMs)}
          cost={HOUSE_CONSTRUCTION_COST}
          pendingElements={pendingHouses}
          renderProgress={renderProgress}
          liveOfflinium={liveOfflinium}
          craftTime="2 min"
          actionLabel="Construire"
        >
          {canBuildHouse
            ? "Construire"
            : `Il vous manque ${HOUSE_CONSTRUCTION_COST - liveOfflinium} ⬡`}
        </CraftTile>

        <CraftTile
          elementName="Compagnon"
          icon="🐾"
          description="Ajoute un compagnon qui peut évoluer."
          count={companions.length}
          countLabel={`compagnon${companions.length > 1 ? "s" : ""} sur ${companionCapacity} places`}
          canBuild={canInvoke}
          onClick={() => invokeCompanion(totalOfflineMs)}
          cost={COMPANION_INVOCATION_COST}
          pendingElements={pendingCompanions}
          renderProgress={renderProgress}
          liveOfflinium={liveOfflinium}
          craftTime="1 min"
          actionLabel="Invoquer"
        >
          {houses.length === 0
            ? "Construisez d'abord une maison"
            : !hasCompanionSlot
              ? "Quota atteint : construisez plus de maisons ou libérez un compagnon"
              : canInvoke
                ? "Invoquer"
                : `Il vous manque ${COMPANION_INVOCATION_COST - liveOfflinium} ⬡`}
        </CraftTile>
      </div>
      {pendingElements.length > 0 && (
        <div
          className="mt-2 flex flex-col gap-1.5"
          aria-label="Constructions en cours"
        >
          {pendingElements.map((pending, index) => (
            <PendingElement key={pending.id} pending={pending} index={index} />
          ))}
        </div>
      )}
    </VillageSection>
  );
}
