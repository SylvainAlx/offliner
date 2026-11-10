import Modal from "./ui/Modal";
import { useUnobservedGapPrompt } from "../hooks/useUnobservedGapPrompt";

/**
 * Asks the player, after the app could not observe the device for a while,
 * whether they stayed offline. Nothing of that time is credited without a yes.
 */
export default function UnobservedGapPrompt() {
  const { isOpen, sinceLabel, durationLabel, capLabel, isCapped, answer } =
    useUnobservedGapPrompt();

  return (
    <Modal
      isOpen={isOpen}
      title="Êtes-vous resté hors ligne ?"
      message={`Offliner vous a vu hors ligne pour la dernière fois ${sinceLabel}, puis n'a pas pu vérifier votre connexion pendant ${durationLabel}.`}
      // An answer is required: closing the dialog would leave the time pending.
      onClose={() => undefined}
    >
      <p className="m-0 mt-3 text-[0.8rem] leading-normal text-(--gray-600)">
        {isCapped
          ? `Si vous répondez oui, ${capLabel} au maximum seront comptées pour cette absence.`
          : "Répondez honnêtement : ce temps ne compte que si vous êtes resté déconnecté."}
      </p>
      <div className="mt-5 grid gap-2">
        <button
          type="button"
          className="min-h-11 cursor-pointer rounded-[10px] border-0 bg-(--green-dark) px-3.5 text-[0.86rem] font-bold text-white"
          onClick={() => answer(true)}
        >
          Oui, je suis resté hors ligne
        </button>
        <button
          type="button"
          className="min-h-11 cursor-pointer rounded-[10px] border border-(--gray-200) bg-(--gray-50) px-3.5 text-[0.86rem] font-bold text-(--gray-700)"
          onClick={() => answer(false)}
        >
          Non, je me suis reconnecté
        </button>
      </div>
    </Modal>
  );
}
