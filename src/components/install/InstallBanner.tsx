import { useState } from "react";
import Modal from "../ui/Modal";
import InstallSteps from "./InstallSteps";
import { useInstall } from "../../stores/installStore";

const DISMISSED_KEY = "offliner:install-banner-dismissed";

/** Reminder shown in the app while it runs in a browser tab. */
export default function InstallBanner() {
  const isStandalone = useInstall((state) => state.isStandalone);
  const platform = useInstall((state) => state.platform);
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(
    () => sessionStorage.getItem(DISMISSED_KEY) === "1",
  );

  if (isStandalone || isDismissed) return null;

  const isDesktop = platform === "desktop";

  return (
    <>
      <div
        className="mx-auto flex w-[min(calc(100%-32px),1080px)] items-center gap-3 rounded-[14px] border border-[rgba(170,59,255,0.25)] bg-white/90 px-3.5 py-2.5 text-[0.84rem] text-(--gray-700) shadow-(--shadow-sm)"
        role="region"
        aria-label="Installer Offliner"
      >
        <img className="size-8 shrink-0 rounded-lg" src="/icons/logo.svg" alt="" />
        <p className="m-0 flex-1">
          {isDesktop
            ? "Offliner est fait pour votre téléphone."
            : "Vous jouez dans le navigateur : installez Offliner comme une app."}
        </p>
        <button
          type="button"
          className="min-h-11 shrink-0 cursor-pointer rounded-[10px] border-0 bg-(--accent) px-3.5 text-[0.82rem] font-bold text-white"
          onClick={() => setIsOpen(true)}
        >
          {isDesktop ? "Ouvrir sur mobile" : "Installer"}
        </button>
        <button
          type="button"
          className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-[10px] border-0 bg-transparent text-[1.3rem] text-(--gray-600) hover:bg-(--gray-50)"
          aria-label="Masquer ce rappel"
          onClick={() => {
            sessionStorage.setItem(DISMISSED_KEY, "1");
            setIsDismissed(true);
          }}
        >
          ×
        </button>
      </div>
      <Modal
        isOpen={isOpen}
        title={isDesktop ? "Ouvrir Offliner sur votre téléphone" : "Installer Offliner"}
        message="Quelques secondes suffisent."
        onClose={() => setIsOpen(false)}
      >
        <div className="mt-4">
          <InstallSteps />
        </div>
        <button
          type="button"
          className="mt-4 min-h-10 w-full cursor-pointer rounded-[10px] border border-(--gray-200) bg-(--gray-50) text-[0.82rem] font-bold text-(--gray-700)"
          onClick={() => setIsOpen(false)}
        >
          Fermer
        </button>
      </Modal>
    </>
  );
}
