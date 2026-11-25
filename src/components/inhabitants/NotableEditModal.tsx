import { useState, type FormEvent } from "react";
import { useUser } from "../../stores/userStore";
import type { Notable } from "../../models/notable";
import { MAX_DESCRIPTION_LENGTH, MAX_NAME_LENGTH } from "../../utils/constants";
import { SPECIALTIES, describeSpecialtyBonus, getSpecialty } from "../../models/specialty";
import CompanionSprite from "../CompanionSprite";
import Modal from "../ui/Modal";

const inputClass =
  "min-h-11 w-full rounded-[10px] border border-(--gray-200) bg-(--surface) px-3 py-2.5 font-inherit text-[0.9rem] text-(--gray-900) outline-offset-1 focus:outline-2 focus:outline-(--accent-border)";
const labelClass = "mb-1 block text-[0.78rem] font-bold text-(--gray-700)";

/** Lets the player give an inhabitant the name, title and story they want. */
export default function NotableEditModal({
  notable,
  onClose,
}: {
  notable: Notable;
  onClose: () => void;
}) {
  const updateNotable = useUser((state) => state.updateNotable);
  const assignNotable = useUser((state) => state.assignNotable);
  const colonies = useUser((state) => state.user.colonies);
  const specialty = getSpecialty(notable);
  const [name, setName] = useState(notable.name);
  const [title, setTitle] = useState(notable.title);
  const [description, setDescription] = useState(notable.description);
  const isLeader = notable.role === "leader";
  const idPrefix = `notable-${notable.id}`;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (updateNotable(notable.id, { name, title, description })) onClose();
  }

  return (
    <Modal
      isOpen
      title={isLeader ? "Votre chef planétaire" : "Habitant de la semaine"}
      message="Donnez-lui le nom, le titre et l'histoire que vous voulez."
      onClose={onClose}
    >
      <div className="mt-4 grid place-items-center">
        <div className="grid size-20 place-items-center rounded-xl bg-(--gray-50)">
          <CompanionSprite
            id={notable.seed}
            className="block size-17 [image-rendering:pixelated] [shape-rendering:crispEdges]"
          />
        </div>
      </div>
      {specialty && (
        <div className="mt-3 rounded-xl border border-(--accent-border) bg-(--accent-bg) p-3 text-[0.8rem] text-(--gray-800)">
          <p className="m-0">
            <strong>
              {SPECIALTIES[specialty].icon} {SPECIALTIES[specialty].label}
            </strong>{" "}
            : {describeSpecialtyBonus(specialty)}
            {SPECIALTIES[specialty].isEmpireWide ? "" : ", sur la planète où il vit"}.
          </p>
          {colonies.length > 1 && (
            <div className="mt-2.5">
              <label className={labelClass} htmlFor={`${idPrefix}-colony`}>
                Planète où il vit
              </label>
              <select
                id={`${idPrefix}-colony`}
                className={inputClass}
                value={notable.colonyId}
                onChange={(event) => assignNotable(notable.id, event.target.value)}
              >
                {colonies.map((colony) => (
                  <option key={colony.id} value={colony.id}>
                    {colony.planet.name}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-[0.7rem] text-(--gray-600)">
                Le déménagement est immédiat : son bonus suit l&apos;habitant.
              </span>
            </div>
          )}
        </div>
      )}
      <form className="mt-3 flex flex-col gap-3" onSubmit={handleSubmit}>
        <div>
          <label className={labelClass} htmlFor={`${idPrefix}-name`}>
            Nom
          </label>
          <input
            id={`${idPrefix}-name`}
            className={inputClass}
            value={name}
            maxLength={MAX_NAME_LENGTH}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass} htmlFor={`${idPrefix}-title`}>
            Titre
          </label>
          <input
            id={`${idPrefix}-title`}
            className={inputClass}
            value={title}
            maxLength={MAX_NAME_LENGTH}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass} htmlFor={`${idPrefix}-description`}>
            Description
          </label>
          <textarea
            id={`${idPrefix}-description`}
            className={`${inputClass} min-h-24 resize-y`}
            value={description}
            maxLength={MAX_DESCRIPTION_LENGTH}
            placeholder={
              isLeader
                ? "Comment guide-t-il la colonie ?"
                : "Qu'a-t-il fait de remarquable cette semaine ?"
            }
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
