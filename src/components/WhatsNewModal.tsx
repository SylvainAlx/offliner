import Modal from "./ui/Modal";
import { useRelease } from "../stores/releaseStore";
import { useUser } from "../stores/userStore";
import { OFFLINER_VERSION } from "../utils/constants";

/** Tells the player, once, what the last minor or major versions brought. */
export default function WhatsNewModal() {
  const notes = useRelease((state) => state.unseenNotes);
  const markSeen = useRelease((state) => state.markSeen);
  // The question about unobserved time comes first: one dialog at a time.
  const hasUnconfirmedGaps = useUser(
    (state) => state.user.periodList.unconfirmedGaps.length > 0,
  );

  return (
    <Modal
      isOpen={notes.length > 0 && !hasUnconfirmedGaps}
      title="Quoi de neuf ?"
      message={`Offliner a été mis à jour en version ${OFFLINER_VERSION}.`}
      onClose={markSeen}
    >
      {notes.map((note) => (
        <section key={note.version} className="mt-4">
          <h3 className="m-0 text-[0.9rem] font-bold text-(--gray-700)">
            {note.title}
          </h3>
          <p className="m-0 text-[0.74rem] text-(--gray-600)">
            Version {note.version} ·{" "}
            <time dateTime={note.date}>
              {new Date(note.date).toLocaleDateString("fr-FR", { dateStyle: "long" })}
            </time>
          </p>
          <ul className="m-0 mt-2 grid list-disc gap-1.5 pl-5 text-[0.84rem] leading-normal text-(--gray-600)">
            {note.changes.map((change) => (
              <li key={change}>{change}</li>
            ))}
          </ul>
        </section>
      ))}
      <div className="mt-5 grid">
        <button
          type="button"
          className="min-h-11 cursor-pointer rounded-[10px] border-0 bg-(--accent-solid) px-3.5 text-[0.86rem] font-bold text-(--on-color)"
          onClick={markSeen}
          autoFocus
        >
          Compris
        </button>
      </div>
    </Modal>
  );
}
