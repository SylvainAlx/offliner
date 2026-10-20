import type { Companion } from "../models/companion";
import type { CompanionStage } from "../models/companion";
import { OFFLINIUM_DELIVERY_INTERVAL } from "../utils/constants";
import { formatDuration } from "../utils/format";
import { createPortal } from "react-dom";
import Button from "./ui/Button";
import ConfirmModal from "./ui/ConfirmModal";
import CompanionSprite from "./CompanionSprite";
import CompanionPreview from "./CompanionPreview";
import { useCompanionTile } from "../hooks/useCompanionTile";

const STAGE_CLASSES: Record<CompanionStage, string> = {
  child:
    "[--card-edge:#3b82f6] [--card-surface:#eff6ff] [--card-accent:#1d4ed8]",
  adolescent:
    "[--card-edge:#16a34a] [--card-surface:#f0fdf4] [--card-accent:#15803d]",
  adult:
    "[--card-edge:#8b5cf6] [--card-surface:#f5f3ff] [--card-accent:#6d28d9]",
  sage: "[--card-edge:#d97706] [--card-surface:#fffbeb] [--card-accent:#b45309]",
};

interface CompanionProps {
  companion: Companion;
}

export default function CompanionTile({ companion }: CompanionProps) {
  const {
    isSpriteOpen,
    setIsSpriteOpen,
    isReleaseModalOpen,
    setIsReleaseModalOpen,
    remainingOfflineMs,
    canRenameCompanion,
    companionName,
    setCompanionName,
    isNameSaved,
    setIsNameSaved,
    handleRename,
    releaseCompanionAndGetOfflinium,
  } = useCompanionTile(companion);

  return (
    <>
      <li
        className={`grid w-full max-w-none grid-cols-[64px_minmax(0,1fr)] gap-x-3 gap-y-1 rounded-xl border border-l-4 border-(--card-edge) bg-(--card-surface) p-2.5 shadow-[0_2px_7px_rgba(17,24,39,0.1)] ${STAGE_CLASSES[companion.stage]}`}
      >
        <button
          type="button"
          className="row-span-3 grid size-16 place-items-center self-start rounded-lg border border-white/70 bg-white/60 p-1 cursor-pointer text-(--card-accent) transition-transform duration-150 ease-out hover:scale-105 focus-visible:outline-2 focus-visible:outline-(--card-accent) focus-visible:outline-offset-2"
          onClick={() => setIsSpriteOpen(true)}
          aria-label={`Voir ${companion.name} en grand`}
        >
          <CompanionSprite
            id={companion.id}
            className="block size-12 [image-rendering:pixelated] [shape-rendering:crispEdges]"
          />
        </button>
        <div className="flex min-w-0 items-start justify-between gap-2">
          <strong className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-(--display) text-[0.95rem] text-(--gray-900)">
            {companion.name}
          </strong>
          <span className="shrink-0 rounded bg-[color-mix(in_srgb,var(--card-accent)_12%,white)] px-1.5 py-0.5 text-[0.58rem] font-extrabold uppercase text-(--card-accent)">
            {companion.stageLabel}
          </span>
        </div>
        <div className="flex min-w-0 items-center gap-2 text-[0.68rem] text-(--gray-600)">
          <span className="font-(--mono) text-(--card-accent)">
            +{companion.harvestBonus} ⬡
          </span>
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">
            toutes les {OFFLINIUM_DELIVERY_INTERVAL / 1000} s hors ligne
          </span>
        </div>
        <div className="text-[0.68rem] text-(--gray-600)">
          {remainingOfflineMs === null
            ? "Stade final atteint"
            : `Prochaine évolution dans ${formatDuration(remainingOfflineMs)} hors ligne`}
        </div>
        {canRenameCompanion && (
          <form
            className="col-span-2 flex flex-col gap-1.5 sm:flex-row"
            onSubmit={handleRename}
          >
            <label className="sr-only" htmlFor={`companion-name-${companion.id}`}>
              Nom de {companion.name}
            </label>
            <input
              id={`companion-name-${companion.id}`}
              className="min-h-8 min-w-0 flex-1 rounded-lg border border-white/80 bg-white/70 px-2 py-1 font-inherit text-[0.72rem] text-(--gray-900) outline-offset-1 focus:outline-2 focus:outline-(--card-accent)"
              type="text"
              value={companionName}
              maxLength={40}
              onChange={(event) => {
                setCompanionName(event.target.value);
                setIsNameSaved(false);
              }}
              required
            />
            <Button
              type="submit"
              onClick={() => {}}
              className="min-h-8! px-2! py-1! text-[0.72rem]!"
            >
              Renommer
            </Button>
          </form>
        )}
        {isNameSaved && (
          <span className="col-span-2 text-[0.68rem] text-(--green-dark)">
            Nom enregistré.
          </span>
        )}
        <div className="flex flex-wrap gap-1.5 [&>button]:min-h-8! [&>button]:rounded-lg! [&>button]:px-2! [&>button]:py-1! [&>button]:text-[0.72rem]!">
          <Button
            onClick={() => setIsReleaseModalOpen(true)}
            color="var(--red-primary)"
          >
            Libérer
          </Button>
        </div>
      </li>

      <ConfirmModal
        isOpen={isReleaseModalOpen}
        title={`Libérer ${companion.name} ?`}
        message="Cette action est définitive. Vous récupérerez le coût d'invocation du compagnon."
        confirmLabel="Libérer"
        onCancel={() => setIsReleaseModalOpen(false)}
        onConfirm={() => {
          releaseCompanionAndGetOfflinium(companion.id);
          setIsReleaseModalOpen(false);
        }}
      />

      {isSpriteOpen &&
        createPortal(
          <CompanionPreview
            companion={companion}
            setIsSpriteOpen={setIsSpriteOpen}
          />,
          document.body,
        )}
    </>
  );
}
