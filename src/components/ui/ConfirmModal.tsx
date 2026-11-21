import Modal from "./Modal";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} title={title} message={message} onClose={onCancel}>
      <div className="flex justify-end gap-2 mt-5">
        <button
          type="button"
          className="min-h-10 px-3.5 py-2 border border-gray-200 rounded-[10px] bg-gray-50 text-gray-700 text-[0.8rem] font-bold cursor-pointer hover:bg-gray-100 transition-colors focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
          onClick={onCancel}
          autoFocus
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          className="min-h-10 px-3.5 py-2 border border-transparent rounded-[10px] bg-(--red-bg) text-(--red-dark) text-[0.8rem] font-bold cursor-pointer hover:bg-(--red-border) transition-colors focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2"
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
