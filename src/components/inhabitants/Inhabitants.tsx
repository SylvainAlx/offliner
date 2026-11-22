import { useState } from "react";
import Card from "../ui/Card";
import CompanionSprite from "../CompanionSprite";
import NotableEditModal from "./NotableEditModal";
import { useUser } from "../../stores/userStore";
import { getNotableWeek, type Notable } from "../../models/notable";
import { NOTABLE_INTERVAL_MS } from "../../utils/constants";
import { formatWait } from "../../utils/format";

const spriteClass = "block [image-rendering:pixelated] [shape-rendering:crispEdges]";

function formatFeaturedDay(ts: number): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(ts),
  );
}

function NewBadge() {
  return (
    <span className="inline-block rounded-full bg-(--green-solid) px-2 py-0.5 text-[0.6rem] font-extrabold tracking-wide text-(--on-color) uppercase">
      Nouveau
    </span>
  );
}

/** The planetary leader, in the spotlight since the first day. */
function LeaderHero({ leader, onEdit }: { leader: Notable; onEdit: () => void }) {
  return (
    <section
      className="flex w-full items-center gap-4 rounded-2xl border border-(--accent-border) bg-[linear-gradient(135deg,var(--accent-bg)_0%,var(--surface)_100%)] p-4 max-sm:flex-col max-sm:text-center"
      aria-label="Chef planétaire"
    >
      <div className="relative grid size-28 shrink-0 place-items-center rounded-2xl bg-(--surface) shadow-(--shadow-sm)">
        <span className="absolute -top-3 text-[1.4rem]" aria-hidden="true">
          👑
        </span>
        <CompanionSprite id={leader.seed} className={`${spriteClass} size-24`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5 max-sm:justify-center">
          <span className="inline-block rounded-full bg-(--accent-solid) px-2 py-0.5 text-[0.62rem] font-extrabold tracking-wide text-(--on-color) uppercase">
            {leader.title}
          </span>
          {!leader.isCustomized && <NewBadge />}
        </div>
        <strong className="mt-1.5 block text-[1.2rem] text-(--gray-900) [overflow-wrap:anywhere]">
          {leader.name}
        </strong>
        <p className="m-0 mt-1 text-[0.82rem] leading-snug text-(--gray-600) [overflow-wrap:anywhere]">
          {leader.description || "Son histoire reste à écrire."}
        </p>
        <span className="mt-1.5 block text-[0.7rem] text-(--gray-500)">
          À la tête de la colonie depuis le {formatFeaturedDay(leader.featuredAt)}
        </span>
      </div>
      <button
        type="button"
        className="min-h-10 shrink-0 cursor-pointer self-start rounded-[10px] border border-(--gray-200) bg-(--surface) px-3 py-2 text-[0.78rem] font-bold text-(--gray-700) hover:bg-(--gray-100) focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--accent) max-sm:self-center"
        onClick={onEdit}
      >
        {leader.isCustomized ? "✏️ Modifier" : "✨ Personnaliser"}
      </button>
    </section>
  );
}

/** How long until the next inhabitant is put in the spotlight. */
function NextNotable({ nextAt, now }: { nextAt: number; now: number }) {
  const remaining = Math.max(0, nextAt - now);
  const progress = 1 - remaining / NOTABLE_INTERVAL_MS;
  return (
    <div className="w-full rounded-2xl border border-dashed border-(--gray-200) bg-(--gray-50) p-3.5">
      <div className="flex items-center gap-3">
        <div
          className="grid size-12 shrink-0 place-items-center rounded-xl bg-(--surface) text-[1.4rem] text-(--gray-400)"
          aria-hidden="true"
        >
          ?
        </div>
        <div className="min-w-0 flex-1">
          <strong className="block text-[0.88rem] text-(--gray-900)">
            Prochain habitant dans {formatWait(remaining)}
          </strong>
          <span className="block text-[0.72rem] text-(--gray-600)">
            Chaque semaine, un habitant se distingue. Le prochain : le{" "}
            {formatFeaturedDay(nextAt)}.
          </span>
        </div>
      </div>
      <div
        className="mt-2.5 h-2 overflow-hidden rounded-full bg-(--gray-200)"
        role="progressbar"
        aria-label="Semaine en cours"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <div
          className="h-full rounded-full bg-(--accent-solid) transition-[width] duration-500"
          style={{ width: `${Math.round(progress * 1000) / 10}%` }}
        />
      </div>
    </div>
  );
}

function NotableTile({
  notable,
  week,
  onEdit,
}: {
  notable: Notable;
  week: number;
  onEdit: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        className={[
          "flex h-full w-full cursor-pointer flex-col items-center gap-1.5 rounded-2xl border bg-(--surface) p-3 text-center font-[inherit]",
          "transition-[transform,border-color] duration-150 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--accent)",
          notable.isCustomized ? "border-(--gray-200)" : "border-(--accent-border) shadow-(--shadow-sm)",
        ].join(" ")}
        onClick={onEdit}
        aria-label={`${notable.name}, ${notable.title}, semaine ${week}${notable.isCustomized ? "" : ", à personnaliser"}`}
      >
        <div className="flex w-full items-center justify-between gap-1">
          <span className="font-(--mono) text-[0.62rem] font-bold text-(--gray-500)">
            Semaine {week}
          </span>
          {!notable.isCustomized && <NewBadge />}
        </div>
        <div className="grid size-18 place-items-center rounded-xl bg-(--gray-50)">
          <CompanionSprite id={notable.seed} className={`${spriteClass} size-15`} />
        </div>
        <strong className="text-[0.85rem] leading-tight text-(--gray-900) [overflow-wrap:anywhere]">
          {notable.name}
        </strong>
        <span className="text-[0.68rem] font-bold text-(--accent) [overflow-wrap:anywhere]">
          {notable.title}
        </span>
        <p className="m-0 line-clamp-3 text-[0.72rem] leading-snug text-(--gray-600) [overflow-wrap:anywhere]">
          {notable.description || (notable.isCustomized ? "" : "Touchez pour raconter son histoire.")}
        </p>
      </button>
    </li>
  );
}

/** The inhabitants in the spotlight: the leader, then one per week. */
export default function Inhabitants() {
  const user = useUser((state) => state.user);
  const [editingId, setEditingId] = useState<string | null>(null);
  const now = user.realTimeSettledAt;
  const leader = user.leader;
  const weekly = user.weeklyNotables;
  const editing = user.notables.find((notable) => notable.id === editingId);
  const colony = user.activeColony;
  const population = Math.floor(colony.population);

  return (
    <Card
      ariaLabel="Habitants"
      title="Habitants célèbres"
      subtitle={`${population} habitant${population > 1 ? "s" : ""} sur ${colony.planet.name} · un nouveau mis en avant chaque semaine`}
    >
      {leader && <LeaderHero leader={leader} onEdit={() => setEditingId(leader.id)} />}

      <NextNotable nextAt={user.getNextNotableAt(now)} now={now} />

      <section className="w-full" aria-label="Habitants de la semaine">
        <h3 className="m-0 mb-2.5 flex items-baseline justify-between text-[0.95rem] font-extrabold text-(--gray-900)">
          Habitants de la semaine
          <span className="text-[0.75rem] font-bold text-(--gray-500)">{weekly.length}</span>
        </h3>
        {weekly.length === 0 ? (
          <p className="m-0 rounded-2xl bg-(--gray-50) p-4 text-center text-[0.82rem] leading-normal text-(--gray-600)">
            Aucun pour l&apos;instant. Au bout de votre première semaine sur la planète, un
            habitant se distinguera : vous pourrez lui donner un nom, un titre et une histoire.
          </p>
        ) : (
          <ul className="m-0 grid list-none grid-cols-2 gap-2.5 p-0 sm:grid-cols-3">
            {weekly.map((notable) => (
              <NotableTile
                key={notable.id}
                notable={notable}
                week={getNotableWeek(notable, user.createdAt)}
                onEdit={() => setEditingId(notable.id)}
              />
            ))}
          </ul>
        )}
      </section>

      {editing && <NotableEditModal notable={editing} onClose={() => setEditingId(null)} />}
    </Card>
  );
}
