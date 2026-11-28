import { useState } from "react";
import Card from "./ui/Card";
import { useOnlineStatus } from "../stores/onlineStatusStore";
import {
  CONTACT_EMAIL,
  DONATION_URL,
  REPOSITORY_URL,
} from "../utils/constants";
import { getFeedbackUrl } from "../utils/contact";

const text = "m-0 text-[0.86rem] leading-normal text-(--gray-600)";
const action =
  "flex min-h-11 items-center justify-center rounded-[10px] px-3.5 text-center text-[0.86rem] font-bold no-underline focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-2";
const primary = `${action} bg-(--accent-solid) text-(--on-color)`;
const secondary = `${action} border border-(--gray-200) bg-(--gray-50) text-(--gray-700)`;

type CopyState = "idle" | "copied" | "failed";

/** Feedback by mail, the code on GitHub and optional donations. */
export default function Support() {
  const isOnline = useOnlineStatus((state) => state.isOnline);
  const [copyState, setCopyState] = useState<CopyState>("idle");

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopyState("copied");
    } catch {
      // The address stays on screen, to be copied by hand.
      setCopyState("failed");
    }
  }

  return (
    <>
      <Card
        ariaLabel="Votre avis"
        title="Votre avis"
        subtitle="Une idée, un bug, une remarque : écrivez-moi."
      >
        <div className="grid w-full gap-3">
          <a className={primary} href={getFeedbackUrl()}>
            Envoyer un retour
          </a>
          <button
            type="button"
            className={`${secondary} cursor-pointer`}
            onClick={() => void copyEmail()}
          >
            Copier l&apos;adresse
          </button>
          <p className={`${text} text-center wrap-anywhere select-all`}>
            {CONTACT_EMAIL}
          </p>
          <p className={`${text} text-center`} role="status">
            {copyState === "copied" && "Adresse copiée."}
            {copyState === "failed" &&
              "Copie impossible : sélectionnez l'adresse ci-dessus."}
          </p>
          <a
            className={secondary}
            href={REPOSITORY_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Voir le code sur GitHub ↗
          </a>
        </div>
      </Card>

      <Card ariaLabel="Soutenir Offliner" title="Soutenir Offliner">
        <div className="grid w-full gap-3">
          <p className={text}>
            Offliner vous plaît ? Vous pouvez soutenir son développement par un
            don sur PayPal. Il est entièrement facultatif et ne donne aucun
            avantage dans le jeu.
          </p>
          {isOnline ? (
            <a
              className={primary}
              href={DONATION_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Faire un don avec PayPal ↗
            </a>
          ) : (
            <>
              <button type="button" className={`${primary} border-0 opacity-40`} disabled>
                Faire un don avec PayPal
              </button>
              <p className={`${text} text-center`}>
                Vous êtes hors ligne, profitez-en : ce lien sera disponible à
                votre prochaine connexion.
              </p>
            </>
          )}
        </div>
      </Card>
    </>
  );
}
