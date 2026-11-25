import type { ReactNode } from "react";
import type { RadarSignal } from "../../models/signal";
import { formatAmount } from "../../models/resources";
import CompanionSprite from "../CompanionSprite";
import PlanetSprite from "../PlanetSprite";

const pixelated = "block [image-rendering:pixelated] [shape-rendering:crispEdges]";

function formatDay(ts: number): string {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" }).format(
    new Date(ts),
  );
}

/** A radar signal: who sent it, from which planet, and what it says. */
export default function SignalCard({
  signal,
  footer,
}: {
  signal: RadarSignal;
  footer?: ReactNode;
}) {
  return (
    <article className="flex w-full flex-col gap-2.5 rounded-2xl border border-(--accent-border) bg-(--surface) p-3">
      <header className="flex items-center gap-3">
        <div className="relative size-14 shrink-0">
          <div className="grid size-14 place-items-center rounded-xl bg-(--gray-50)">
            <CompanionSprite id={signal.authorSeed} className={`${pixelated} size-12`} />
          </div>
          <PlanetSprite
            seed={signal.planetSeed}
            kind={signal.planetKind ?? undefined}
            className={`${pixelated} absolute -right-1.5 -bottom-1.5 size-6`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <strong className="block text-[0.9rem] text-(--gray-900) [overflow-wrap:anywhere]">
            {signal.authorName}
          </strong>
          <span className="block text-[0.72rem] font-bold text-(--accent) [overflow-wrap:anywhere]">
            {signal.authorTitle} · {signal.planetName}
          </span>
          <span className="block text-[0.68rem] text-(--gray-500)">
            Émis le {formatDay(signal.sentAt)}
          </span>
        </div>
        {signal.score !== null && (
          <span
            className="shrink-0 self-start rounded-full bg-yellow-50 px-2.5 py-1 font-(--mono) text-[0.72rem] font-bold whitespace-nowrap text-yellow-700"
            title="Score de l'émetteur au moment de l'envoi"
          >
            🏆 {formatAmount(signal.score)} pts
          </span>
        )}
      </header>
      <p className="m-0 rounded-xl bg-(--gray-50) p-3 text-[0.84rem] leading-normal whitespace-pre-wrap text-(--gray-900) [overflow-wrap:anywhere]">
        {signal.message}
      </p>
      {footer}
    </article>
  );
}
