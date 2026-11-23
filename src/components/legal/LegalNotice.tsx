import { useState, type ReactNode } from "react";
import Modal from "../ui/Modal";

const AUTHOR = "Sylvain Alexandre";
const AUTHOR_PROFILE = "https://github.com/SylvainAlx";

const heading = "m-0 mt-4 mb-1 text-[0.88rem] font-extrabold text-(--gray-900)";
const text = "m-0 text-[0.8rem] leading-normal text-(--gray-600)";
const link = "font-bold text-(--accent) underline underline-offset-2";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className={heading}>{title}</h3>
      <div className="flex flex-col gap-1.5">{children}</div>
    </section>
  );
}

/** Legal notice of the application (French law: LCEN, article 1-1). */
function LegalNoticeContent() {
  return (
    <div className="mt-1 flex flex-col">
      <Section title="Éditeur">
        <p className={text}>
          Offliner est édité à titre personnel et non professionnel par {AUTHOR},
          directeur de la publication. Conformément à l&apos;article 1-1, II de la loi
          n° 2004-575 du 21 juin 2004 pour la confiance dans l&apos;économie numérique,
          ses coordonnées ont été communiquées à l&apos;hébergeur et ne sont pas
          rendues publiques.
        </p>
        <p className={text}>
          Contact : via son profil GitHub,{" "}
          <a className={link} href={AUTHOR_PROFILE} target="_blank" rel="noreferrer">
            github.com/SylvainAlx
          </a>
          .
        </p>
      </Section>

      <Section title="Hébergeur">
        <p className={text}>
          Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis —{" "}
          <a className={link} href="https://vercel.com" target="_blank" rel="noreferrer">
            vercel.com
          </a>
          .
        </p>
      </Section>

      <Section title="Propriété intellectuelle">
        <p className={text}>
          © {new Date().getFullYear()} {AUTHOR}. Tous droits réservés. Le code, les
          textes et les graphismes d&apos;Offliner sont protégés par le droit
          d&apos;auteur : toute reproduction, modification ou réutilisation sans
          autorisation écrite est interdite.
        </p>
      </Section>

      <Section title="Données personnelles">
        <p className={text}>
          Offliner fonctionne sans compte et sans serveur de jeu. Votre partie,
          votre pseudo et votre historique hors ligne sont enregistrés uniquement
          sur votre appareil (stockage local du navigateur) ; ils ne sont jamais
          transmis à l&apos;éditeur. Le jeu n&apos;utilise ni cookie, ni publicité, ni
          outil de mesure d&apos;audience.
        </p>
        <p className={text}>
          Vous pouvez tout supprimer à tout moment depuis l&apos;onglet Compte
          (« Effacer toutes les données ») ou en effaçant les données du site dans
          votre navigateur.
        </p>
        <p className={text}>
          Comme tout hébergeur, Vercel peut enregistrer des données techniques de
          connexion (adresse IP, date, page demandée) pour faire fonctionner et
          sécuriser le service. Voir sa{" "}
          <a
            className={link}
            href="https://vercel.com/legal/privacy-policy"
            target="_blank"
            rel="noreferrer"
          >
            politique de confidentialité
          </a>
          .
        </p>
      </Section>
    </div>
  );
}

/** A link that opens the legal notice, for the footer and the home page. */
export default function LegalNoticeLink({ className = "" }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={`cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-inherit underline underline-offset-2 hover:text-(--gray-900) ${className}`}
        onClick={() => setIsOpen(true)}
      >
        Mentions légales
      </button>
      <Modal
        isOpen={isOpen}
        title="Mentions légales"
        message="Informations sur l'éditeur, l'hébergeur et vos données."
        onClose={() => setIsOpen(false)}
        size="lg"
      >
        <LegalNoticeContent />
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            className="min-h-10 cursor-pointer rounded-[10px] border-0 bg-(--accent-solid) px-4 text-[0.8rem] font-bold text-(--on-color)"
            onClick={() => setIsOpen(false)}
          >
            Fermer
          </button>
        </div>
      </Modal>
    </>
  );
}
