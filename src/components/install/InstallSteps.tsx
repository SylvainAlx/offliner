import type { ReactNode } from "react";
import Button from "../ui/Button";
import QrCode from "./QrCode";
import {
  AddToHomeIcon,
  CheckIcon,
  MoreHorizontalIcon,
  MoreVerticalIcon,
  ShareIcon,
} from "./icons";
import { useInstallGuide } from "../../hooks/useInstallGuide";

function Steps({ children }: { children: ReactNode }) {
  return <ol className="m-0 grid list-none gap-2.5 p-0">{children}</ol>;
}

function Step({ index, children }: { index: number; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3 rounded-[14px] border border-(--gray-100) bg-white p-3 text-[0.86rem] leading-normal text-(--gray-700)">
      <span
        className="grid size-7 shrink-0 place-items-center rounded-full bg-(--accent) text-[0.8rem] font-extrabold text-white"
        aria-hidden="true"
      >
        {index}
      </span>
      <span className="pt-0.5">{children}</span>
    </li>
  );
}

function Key({ children }: { children: ReactNode }) {
  return (
    <strong className="inline-flex items-center gap-1 rounded-md bg-(--gray-100) px-1.5 py-px font-semibold text-(--gray-900)">
      {children}
    </strong>
  );
}

/** Platform-specific instructions to install Offliner as an app. */
export default function InstallSteps() {
  const {
    platform,
    canPrompt,
    justInstalled,
    hasProgress,
    appUrl,
    feedback,
    install,
    copyLink,
    exportProgress,
  } = useInstallGuide();

  if (justInstalled) {
    return (
      <div
        className="flex items-start gap-3 rounded-[14px] border border-green-200 bg-(--green-bg) p-4 text-(--green-dark)"
        role="status"
      >
        <CheckIcon />
        <div>
          <p className="m-0 font-extrabold">Offliner est installé.</p>
          <p className="m-0 mt-1 text-[0.84rem] text-(--gray-700)">
            Ouvrez-le désormais depuis votre écran d&apos;accueil ou la liste de
            vos applications.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {platform === "android" &&
        (canPrompt ? (
          <div className="grid gap-2">
            <Button onClick={() => void install()} className="w-full">
              Installer Offliner
            </Button>
            <p className="m-0 text-center text-[0.76rem] text-(--gray-600)">
              Gratuit, sans passer par un store, en quelques secondes.
            </p>
          </div>
        ) : (
          <Steps>
            <Step index={1}>
              Touchez le menu <Key><MoreVerticalIcon /></Key> du navigateur, en
              haut à droite.
            </Step>
            <Step index={2}>
              Choisissez <Key>Installer l&apos;application</Key> ou{" "}
              <Key>Ajouter à l&apos;écran d&apos;accueil</Key>.
            </Step>
            <Step index={3}>
              Confirmez, puis ouvrez Offliner depuis votre écran d&apos;accueil.
            </Step>
          </Steps>
        ))}

      {platform === "ios" && (
        <Steps>
          <Step index={1}>
            Touchez <Key><ShareIcon /> Partager</Key>. Sur iOS 26, il se trouve
            dans le menu <Key><MoreHorizontalIcon /></Key> à côté de la barre
            d&apos;adresse.
          </Step>
          <Step index={2}>
            Faites défiler et touchez{" "}
            <Key><AddToHomeIcon /> Sur l&apos;écran d&apos;accueil</Key>.
          </Step>
          <Step index={3}>
            Laissez <Key>Ouvrir comme app web</Key> activé, puis touchez{" "}
            <Key>Ajouter</Key>.
          </Step>
        </Steps>
      )}

      {platform === "in-app" && (
        <>
          <p className="m-0 text-[0.86rem] leading-normal text-(--gray-700)">
            Vous êtes dans le navigateur intégré d&apos;une autre application,
            qui ne permet pas d&apos;installer Offliner.
          </p>
          <Steps>
            <Step index={1}>
              Touchez le menu <Key><MoreHorizontalIcon /></Key> ou{" "}
              <Key><MoreVerticalIcon /></Key> de cette application.
            </Step>
            <Step index={2}>
              Choisissez <Key>Ouvrir dans le navigateur</Key> (Safari ou
              Chrome).
            </Step>
            <Step index={3}>Suivez ensuite le guide d&apos;installation.</Step>
          </Steps>
          <Button onClick={() => void copyLink()} color="var(--green-dark)" className="w-full">
            Copier le lien
          </Button>
        </>
      )}

      {platform === "desktop" && (
        <div className="@container">
        <div className="flex items-center gap-5 @max-md:flex-col @max-md:text-center">
          <div className="shrink-0 rounded-[18px] border border-(--gray-100) bg-white p-2.5 shadow-(--shadow-md)">
            <QrCode value={appUrl} />
          </div>
          <div className="grid gap-2 text-[0.86rem] leading-normal text-(--gray-700)">
            <p className="m-0">
              Scannez ce code avec l&apos;appareil photo de votre téléphone pour
              y ouvrir Offliner : le guide d&apos;installation s&apos;affichera.
            </p>
            <p className="m-0 font-mono text-[0.78rem] break-all text-(--gray-600)">
              {appUrl}
            </p>
            {canPrompt && (
              <Button onClick={() => void install()} color="var(--green-dark)">
                Installer aussi sur cet ordinateur
              </Button>
            )}
          </div>
        </div>
        </div>
      )}

      {platform === "ios" && hasProgress && (
        <div className="grid gap-2 rounded-[14px] border border-amber-200 bg-amber-50 p-3.5 text-[0.8rem] leading-normal text-amber-900">
          <p className="m-0">
            Sur iPhone, l&apos;app installée peut ne pas retrouver la progression
            faite dans le navigateur. Exportez-la maintenant, puis importez-la
            dans l&apos;app (Compte › Données du compte).
          </p>
          <Button onClick={() => void exportProgress()} color="#92400e">
            Exporter ma progression
          </Button>
        </div>
      )}

      {feedback && (
        <p
          className={`m-0 text-center text-[0.8rem] ${
            feedback.kind === "success" ? "text-(--green-dark)" : "text-(--red-dark)"
          }`}
          role={feedback.kind === "error" ? "alert" : "status"}
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}
