import { useState, type ReactNode } from "react";
import Modal from "../ui/Modal";
import { AUTHOR_GITHUB_URL, CONTACT_EMAIL } from "../../utils/constants";

const AUTHOR = "Sylvain Alexandre";

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
          Contact : par e-mail à{" "}
          <a className={`${link} wrap-anywhere`} href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          , ou via son profil GitHub,{" "}
          <a className={link} href={AUTHOR_GITHUB_URL} target="_blank" rel="noreferrer">
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
          sur votre appareil (stockage local du navigateur) ; le jeu ne les
          transmet jamais à l&apos;éditeur. Le jeu n&apos;utilise ni cookie, ni publicité, ni
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

      <Section title="Contact et dons">
        <p className={text}>
          <strong>Responsable du traitement :</strong> {AUTHOR}, joignable à{" "}
          <span className="wrap-anywhere">{CONTACT_EMAIL}</span>.
        </p>
        <p className={text}>
          <strong>Messages :</strong> si vous m&apos;écrivez, je reçois votre adresse
          e-mail, le contenu de votre message et les informations techniques jointes
          à tout e-mail. Je les utilise uniquement pour traiter votre demande, vous
          répondre et corriger ou améliorer Offliner. Ce traitement repose sur mon
          intérêt légitime à répondre aux personnes qui me contactent et à améliorer
          l&apos;application (article 6.1.f du RGPD). Merci de ne pas m&apos;envoyer
          d&apos;informations sensibles. Les messages sont supprimés au plus tard 12
          mois après le dernier échange.
        </p>
        <p className={text}>
          <strong>Dons :</strong> facultatifs, ils passent par PayPal, qui traite
          vos informations selon sa{" "}
          <a
            className={link}
            href="https://www.paypal.com/fr/legalhub/paypal/privacy-full"
            target="_blank"
            rel="noreferrer"
          >
            politique de confidentialité
          </a>{" "}
          et applique ses propres durées de conservation. Je reçois les
          informations que PayPal communique au bénéficiaire et les utilise pour le
          suivi des dons, sur la base de mon intérêt légitime à gérer les sommes
          reçues, et pour respecter mes éventuelles obligations légales. Je les
          conserve le temps nécessaire à ce suivi, ou plus longtemps si la loi
          l&apos;impose.
        </p>
        <p className={text}>
          <strong>Destinataires :</strong> ces informations ne servent ni à la
          publicité ni à la revente. Les messages passent par le service d&apos;alias
          Proton Pass, de la société suisse Proton (voir sa{" "}
          <a
            className={link}
            href="https://proton.me/pass/privacy-policy"
            target="_blank"
            rel="noreferrer"
          >
            politique de confidentialité
          </a>
          ), puis par mon fournisseur de messagerie. La Commission européenne
          reconnaît à la Suisse un niveau de protection adéquat. Pour savoir si
          d&apos;autres transferts hors de l&apos;Union européenne ont lieu et avec
          quelles garanties, écrivez-moi.
        </p>
        <p className={text}>
          <strong>Vos droits :</strong> vous pouvez demander l&apos;accès à vos
          données, leur rectification, leur effacement ou la limitation de leur
          traitement, et vous opposer à ce traitement, dans les conditions prévues
          par le RGPD, en écrivant à l&apos;adresse ci-dessus. Vous pouvez aussi
          déposer une réclamation auprès de la{" "}
          <a className={link} href="https://www.cnil.fr" target="_blank" rel="noreferrer">
            CNIL
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
