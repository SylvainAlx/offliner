import InstallSteps from "./InstallSteps";
import { useInstall } from "../../stores/installStore";

const TITLES = {
  ios: "Ajoutez Offliner à votre écran d'accueil",
  android: "Installez Offliner sur votre téléphone",
  "in-app": "Ouvrez Offliner dans votre navigateur",
  desktop: "Offliner se vit sur votre téléphone",
} as const;

const BENEFITS = [
  "S'ouvre en un geste depuis l'écran d'accueil, en plein écran.",
  "Fonctionne sans connexion, même en mode avion.",
  "Ne se perd plus au milieu de vos onglets.",
];

/** Full-screen step shown after the welcome page when the app runs in a browser tab. */
export default function InstallGuide({ onContinue }: { onContinue: () => void }) {
  const platform = useInstall((state) => state.platform);
  const justInstalled = useInstall((state) => state.justInstalled);

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#f4efff_0%,#ffffff_45%)] px-4 py-8 text-(--gray-900)">
      <div className="mx-auto grid w-full max-w-130 gap-6">
        <header className="grid justify-items-center gap-3 text-center">
          <img className="size-18 rounded-[18px] shadow-(--shadow-lg)" src="/icons/logo.svg" alt="" />
          <h1 className="m-0 text-[clamp(1.6rem,6vw,2.1rem)] leading-tight font-extrabold tracking-[-0.03em]">
            {TITLES[platform]}
          </h1>
          <p className="m-0 max-w-110 text-[0.92rem] leading-normal text-(--gray-600)">
            Offliner est conçu pour être installé comme une application : votre
            village vous accompagne chaque fois que vous posez votre téléphone.
          </p>
        </header>

        <ul className="m-0 grid list-none gap-1.5 p-0 text-[0.84rem] text-(--gray-700)">
          {BENEFITS.map((benefit) => (
            <li className="flex items-start gap-2" key={benefit}>
              <span className="text-(--green-dark)" aria-hidden="true">✓</span>
              {benefit}
            </li>
          ))}
        </ul>

        <section aria-label="Étapes d'installation">
          <InstallSteps />
        </section>

        <button
          type="button"
          className="mx-auto min-h-11 cursor-pointer rounded-[10px] border-0 bg-transparent px-4 text-[0.84rem] font-semibold text-(--gray-600) underline underline-offset-4 hover:text-(--gray-900)"
          onClick={onContinue}
        >
          {justInstalled ? "Continuer ici pour l'instant" : "Continuer dans le navigateur"}
        </button>
      </div>
    </main>
  );
}
