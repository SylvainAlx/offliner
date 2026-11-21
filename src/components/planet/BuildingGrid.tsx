import { useCallback, useState } from "react";
import { usePlanet, type BuildingTileData } from "../../hooks/usePlanet";
import type { BuildingType } from "../../models/buildings";
import { formatDuration } from "../../utils/format";
import { CraftTile } from "../CraftTile";
import PlanetSection from "../PlanetSection";
import BuildingDetailModal from "./BuildingDetailModal";
import BuildingSprite from "../BuildingSprite";

function actionLabel(tile: BuildingTileData): string {
  if (tile.isUnderConstruction) return "En cours";
  if (tile.blocker === "busy") return "Chantier occupé";
  if (tile.blocker === "noField") return "Plus de place";
  return tile.level === 0 ? "Construire" : `Niveau ${tile.nextLevel}`;
}

export default function BuildingGrid() {
  const { planet, planetKind, buildings, startConstruction } = usePlanet();
  const [detail, setDetail] = useState<BuildingType | null>(null);
  const closeDetail = useCallback(() => setDetail(null), []);

  return (
    <PlanetSection
      title="Bâtiments"
      subtitle="Une construction à la fois, en temps réel, même application fermée."
    >
      <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3">
        {buildings.map((tile) => (
          <CraftTile
            key={tile.type}
            elementName={tile.definition.label}
            illustration={
              <BuildingSprite
                type={tile.type}
                level={tile.level}
                kind={planetKind}
                isPreview={tile.level === 0}
              />
            }
            status={
              tile.isUnderConstruction
                ? `En construction → ${tile.nextLevel}`
                : tile.level > 0
                  ? `Niveau ${tile.level}`
                  : "Non construit"
            }
            cost={tile.cost}
            missing={tile.missing}
            craftTime={formatDuration(tile.constructionMs)}
            canBuild={tile.blocker === null}
            onClick={() => startConstruction(tile.type)}
            actionLabel={actionLabel(tile)}
            onDetail={() => setDetail(tile.type)}
          />
        ))}
      </div>
      <BuildingDetailModal
        type={detail}
        level={detail ? planet.levels[detail] : 0}
        onClose={closeDetail}
      />
    </PlanetSection>
  );
}
