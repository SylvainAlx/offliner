import { createPortal } from "react-dom";
import { useModal } from "../../hooks/useModal";

interface ModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({
  isOpen,
  title,
  message,
  onClose,
  children,
}: ModalProps) {
  const { titleId, messageId } = useModal(isOpen, onClose);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed z-1100 inset-0 grid place-items-center p-6 bg-[rgba(17,24,39,0.68)] animate-[modal-fade-in_0.15s_ease-out]"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="w-[min(100%,380px)] max-h-[calc(100svh-48px)] overflow-y-auto p-6 border border-gray-100 rounded-[18px] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
      >
        <h2
          id={titleId}
          className="m-0 mb-2 text-gray-900 text-[1.05rem] font-medium"
        >
          {title}
        </h2>
        <p
          id={messageId}
          className="m-0 text-gray-600 text-[0.84rem] leading-normal"
        >
          {message}
        </p>
        {children}
      </div>
    </div>,
    document.body,
  );
}
