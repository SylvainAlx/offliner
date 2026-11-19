import { useCallback, useState } from "react";
import {
  useVillageConstructions,
  type BuildingTileData,
} from "../hooks/useVIllageConstructions";
import { COMPANION_INVOCATION_OFFLINE_MS } from "../utils/constants";
import { BUILDINGS, type BuildingType } from "../models/building";
import { missingResources } from "../models/resources";
import { formatDuration } from "../utils/format";
import PendingElement from "./PendingElement";
import VillageSection from "./VillageSection";
import { CraftTile } from "./CraftTile";
import ElementDetailModal, { type DetailTarget } from "./ElementDetailModal";

function requirementLabel(type: BuildingType): string {
  const [required] = Object.keys(BUILDINGS[type].requires ?? {}) as BuildingType[];
  return required ? `🔒 ${BUILDINGS[required].label}` : "🔒 Verrouillé";
}

function buildingStatus(tile: BuildingTileData): string {
  if (!tile.isUnlocked) return requirementLabel(tile.type);
  return tile.level > 0 ? `Niveau ${tile.level}` : "Non construit";
}

function buildingAction(tile: BuildingTileData): string {
  if (!tile.isUnlocked) return "Verrouillé";
  if (tile.isMaxed) return tile.pendingElements.length > 0 ? "En cours" : "Max";
  return tile.nextLevel === 1 ? "Construire" : `Niveau ${tile.nextLevel}`;
}

export default function VillageConstructions() {
  const {
    buildings,
    companions,
    companionCapacity,
    companionCost,
    canInvoke,
    houseLevel,
    invokeCompanion,
    queueBuilding,
    pendingElements,
    pendingCompanions,
    renderProgress,
    totalOfflineMs,
    available,
    getLevel,
    getPlannedLevel,
  } = useVillageConstructions();
  const [detail, setDetail] = useState<DetailTarget | null>(null);
  const closeDetail = useCallback(() => setDetail(null), []);

  return (
    <VillageSection
      title="À construire / invoquer"
      subtitle="Chaque élément avance pendant vos périodes hors ligne."
    >
      <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3">
        {buildings.map((tile) => (
          <CraftTile
            key={tile.type}
            elementName={tile.definition.label}
            icon={tile.definition.icon}
            status={buildingStatus(tile)}
            cost={tile.isMaxed ? {} : tile.cost}
            missing={tile.missing}
            craftTime={tile.isMaxed ? "—" : formatDuration(tile.constructionOfflineMs)}
            canBuild={tile.canQueue}
            onClick={() => queueBuilding(tile.type, totalOfflineMs)}
            actionLabel={buildingAction(tile)}
            onDetail={() => setDetail(tile.type)}
            pendingElements={tile.pendingElements}
            renderProgress={renderProgress}
          />
        ))}

        <CraftTile
          elementName="Compagnon"
          icon="🐾"
          status={
            houseLevel === 0
              ? `🔒 ${BUILDINGS.house.label}`
              : `${companions.length}/${companionCapacity} places`
          }
          cost={companionCost}
          missing={missingResources(available, companionCost)}
          craftTime={formatDuration(COMPANION_INVOCATION_OFFLINE_MS)}
          canBuild={canInvoke}
          onClick={() => invokeCompanion(totalOfflineMs)}
          actionLabel="Invoquer"
          onDetail={() => setDetail("companion")}
          pendingElements={pendingCompanions}
          renderProgress={renderProgress}
        />
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
      <ElementDetailModal
        target={detail}
        getLevel={getLevel}
        getPlannedLevel={getPlannedLevel}
        onClose={closeDetail}
      />
    </VillageSection>
  );
}
