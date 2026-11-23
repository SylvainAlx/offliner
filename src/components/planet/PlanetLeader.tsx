import { useUser } from "../../stores/userStore";
import CompanionSprite from "../CompanionSprite";

/**
 * The planetary leader, in short. The full story, and the inhabitants of
 * each week, are in the Habitants section.
 */
export default function PlanetLeader({
  onOpenInhabitants,
}: {
  onOpenInhabitants: () => void;
}) {
  const leader = useUser((state) => state.user.leader);
  const toCustomize = useUser((state) => state.user.notablesToCustomize);

  if (!leader) return null;

  return (
    <button
      type="button"
      className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-(--accent-border) bg-(--accent-bg) p-2.5 text-left font-[inherit] transition-all duration-150 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--accent)"
      onClick={onOpenInhabitants}
      aria-label={`${leader.title} : ${leader.name}. Voir les habitants célèbres${toCustomize > 0 ? `, ${toCustomize} à personnaliser` : ""}`}
    >
      <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-(--surface) shadow-(--shadow-sm)">
        <CompanionSprite
          id={leader.seed}
          className="block size-12 [image-rendering:pixelated] [shape-rendering:crispEdges]"
        />
      </div>
      <div className="min-w-0 flex-1">
        <span className="inline-block whitespace-nowrap rounded-full bg-(--accent-solid) px-2 py-0.5 text-[0.62rem] font-extrabold tracking-wide text-(--on-color) uppercase">
          👑 {leader.title}
        </span>
        <strong className="mt-1 block text-[0.92rem] text-(--gray-900) [overflow-wrap:anywhere]">
          {leader.name}
        </strong>
      </div>
      {toCustomize > 0 && (
        <span
          className="grid h-5.5 min-w-5.5 shrink-0 place-items-center rounded-full bg-(--green-solid) px-1.5 text-[0.7rem] font-black text-(--on-color)"
          title={`${toCustomize} à personnaliser`}
          aria-hidden="true"
        >
          {toCustomize}
        </span>
      )}
      <span
        className="shrink-0 text-[0.78rem] font-bold text-(--accent)"
        aria-hidden="true"
      >
        <span className="max-sm:hidden">Habitants </span>›
      </span>
    </button>
  );
}
