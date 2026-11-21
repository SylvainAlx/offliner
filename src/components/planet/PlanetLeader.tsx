import { useState, type FormEvent } from "react";
import { useUser } from "../../stores/userStore";
import type { Notable } from "../../models/notable";
import { MAX_DESCRIPTION_LENGTH, MAX_NAME_LENGTH } from "../../utils/constants";
import CompanionSprite from "../CompanionSprite";
import Modal from "../ui/Modal";

const inputClass =
  "min-h-11 w-full rounded-[10px] border border-(--gray-200) bg-(--surface) px-3 py-2.5 font-inherit text-[0.9rem] text-(--gray-900) outline-offset-1 focus:outline-2 focus:outline-(--accent-border)";
const labelClass = "mb-1 block text-[0.78rem] font-bold text-(--gray-700)";

function EditLeaderModal({
  leader,
  onClose,
}: {
  leader: Notable;
  onClose: () => void;
}) {
  const updateNotable = useUser((state) => state.updateNotable);
  const [name, setName] = useState(leader.name);
  const [title, setTitle] = useState(leader.title);
  const [description, setDescription] = useState(leader.description);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (updateNotable(leader.id, { name, title, description })) onClose();
  }

  return (
    <Modal
      isOpen
      title="Votre chef planétaire"
      message="Donnez-lui le nom, le titre et l'histoire que vous voulez."
      onClose={onClose}
    >
      <form className="mt-4 flex flex-col gap-3" onSubmit={handleSubmit}>
        <div>
          <label className={labelClass} htmlFor="leader-name">
            Nom
          </label>
          <input
            id="leader-name"
            className={inputClass}
            value={name}
            maxLength={MAX_NAME_LENGTH}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="leader-title">
            Titre
          </label>
          <input
            id="leader-title"
            className={inputClass}
            value={title}
            maxLength={MAX_NAME_LENGTH}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="leader-description">
            Description
          </label>
          <textarea
            id="leader-description"
            className={`${inputClass} min-h-24 resize-y`}
            value={description}
            maxLength={MAX_DESCRIPTION_LENGTH}
            onChange={(event) => setDescription(event.target.value)}
          />
          <span className="mt-1 block text-right font-(--mono) text-[0.68rem] text-(--gray-500)">
            {description.length} / {MAX_DESCRIPTION_LENGTH}
          </span>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="min-h-10 cursor-pointer rounded-[10px] border border-(--gray-200) bg-(--gray-50) px-3.5 py-2 text-[0.8rem] font-bold text-(--gray-700) hover:bg-(--gray-100)"
            onClick={onClose}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="min-h-10 cursor-pointer rounded-[10px] border-0 bg-(--accent-solid) px-4 py-2 text-[0.8rem] font-bold text-(--on-color)"
          >
            Enregistrer
          </button>
        </div>
      </form>
    </Modal>
  );
}

/** The inhabitant who leads the planet, there from the first day. */
export default function PlanetLeader() {
  const leader = useUser((state) => state.user.leader);
  const [isEditing, setIsEditing] = useState(false);

  if (!leader) return null;

  return (
    <section
      className="flex items-center gap-3 rounded-2xl border border-(--accent-border) bg-(--accent-bg) p-3"
      aria-label="Chef planétaire"
    >
      <div className="grid size-18 shrink-0 place-items-center rounded-xl bg-(--surface) shadow-(--shadow-sm)">
        <CompanionSprite
          id={leader.seed}
          className="block size-15 [image-rendering:pixelated] [shape-rendering:crispEdges]"
        />
      </div>
      <div className="min-w-0 flex-1">
        <span className="inline-block rounded-full bg-(--accent-solid) px-2 py-0.5 text-[0.62rem] font-extrabold tracking-wide text-(--on-color) uppercase">
          👑 {leader.title}
        </span>
        <strong className="mt-1 block text-[0.95rem] text-(--gray-900) [overflow-wrap:anywhere]">
          {leader.name}
        </strong>
        {leader.description && (
          <p className="m-0 mt-0.5 text-[0.76rem] leading-snug text-(--gray-600) [overflow-wrap:anywhere]">
            {leader.description}
          </p>
        )}
      </div>
      <button
        type="button"
        className="grid size-9 shrink-0 cursor-pointer place-items-center self-start rounded-[10px] border border-(--gray-200) bg-(--surface) text-[0.9rem] hover:bg-(--gray-100) focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-1"
        onClick={() => setIsEditing(true)}
        aria-label={`Modifier ${leader.name}`}
        title="Modifier"
      >
        ✏️
      </button>
      {isEditing && (
        <EditLeaderModal leader={leader} onClose={() => setIsEditing(false)} />
      )}
    </section>
  );
}
