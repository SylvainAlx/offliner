import Button from "./ui/Button";
import HomeIllustration from "./home/HomeIllustration";
import RadarShowcase from "./home/RadarShowcase";
import LegalNoticeLink from "./legal/LegalNotice";
import { useHomePage } from "../hooks/useHomePage";

export default function HomePage({ onPlay }: { onPlay: () => void }) {
  const { scene, drawAnotherScene } = useHomePage();

  return (
    <main className="relative min-h-svh overflow-hidden bg-[radial-gradient(circle_at_8%_12%,rgba(170,59,255,0.12),transparent_34%),radial-gradient(circle_at_92%_78%,rgba(34,197,94,0.12),transparent_35%),var(--page-bg)] p-6 text-(--gray-900) max-[760px]:px-4 max-[760px]:py-4.5">
      <div
        className="pointer-events-none absolute -top-52.5 left-1/4 size-80 rounded-full bg-[rgba(170,59,255,0.1)] opacity-[0.55] blur-xs"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-45 -bottom-42.5 size-80 rounded-full bg-[rgba(34,197,94,0.1)] opacity-[0.55] blur-xs"
        aria-hidden="true"
      />

      <div className="relative z-1 mx-auto w-full max-w-262.5">
        <header className="flex items-center justify-between gap-5 py-1 max-[430px]:items-start max-[430px]:flex-col max-[430px]:gap-1.5">
          <div
            className="inline-flex items-center gap-1 text-[2rem] font-extrabold tracking-[-0.03em]"
            aria-label="Offliner"
          >
            <img className="size-12.5" src="/icons/logo.svg" alt="Offliner" />
            <span>Offliner</span>
          </div>
        </header>

        <section
          className="grid min-h-107.5 grid-cols-[minmax(0,1.03fr)_minmax(300px,0.97fr)] items-center gap-[clamp(28px,6vw,82px)] py-[56px_40px] max-[760px]:grid-cols-1 max-[760px]:gap-6.75 max-[760px]:min-h-0 max-[760px]:py-[46px_28px] max-[430px]:py-[36px_0]"
          aria-labelledby="home-page-title"
        >
          <div className="max-w-147.5">
            <ul
              className="m-0 flex list-none flex-wrap gap-2 p-0"
              aria-label="Les deux idées d'Offliner"
            >
              <li className="rounded-full bg-(--green-bg) px-3 py-1 text-[0.74rem] font-extrabold text-(--green-dark)">
                ⬡ Jouez en décrochant
              </li>
              <li className="rounded-full bg-(--accent-bg) px-3 py-1 text-[0.74rem] font-extrabold text-(--accent)">
                📡 Signaux entre joueurs
              </li>
            </ul>
            <h1
              className="mt-4.5 mb-4 max-w-162.5 text-[clamp(2.55rem,5.5vw,4.65rem)] font-extrabold leading-[0.98] tracking-[-0.065em] text-(--gray-900) max-[760px]:text-[clamp(2.45rem,12vw,4rem)] max-[430px]:mt-3.75 max-[430px]:text-[clamp(2.35rem,13vw,3.5rem)]"
              id="home-page-title"
            >
              Déconnectez,
              <br />
              <span className="text-(--green-dark)">
                Bâtissez votre planète.
              </span>
            </h1>
            <p className="max-w-130 text-[clamp(0.92rem,1.5vw,1.04rem)] leading-[1.6] text-(--gray-600)">
              Offliner est un jeu de gestion de planète : mines, réacteur,
              fermes et habitats se construisent en temps réel. Votre temps
              hors-ligne produit l'Offlinium, la ressource qui fait tout
              avancer plus vite. Et grâce au radar, vos planètes échangent
              des messages avec celles de vos amis, sans aucun serveur.
            </p>
            {/* <button type="button" className="home-page-play" onClick={onPlay}>
              Jouer <span aria-hidden="true">→</span>
            </button> */}
            <Button onClick={onPlay}>
              Jouer <span aria-hidden="true">→</span>
            </Button>
          </div>

          <HomeIllustration scene={scene} onDrawAnother={drawAnotherScene} />
        </section>

        <RadarShowcase scene={scene} />

        <section
          className="grid grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] gap-3 max-[760px]:grid-cols-1"
          aria-label="À propos d'Offliner"
        >
          <article className="flex items-start gap-3.25 rounded-[17px] border border-(--gray-100) bg-(--surface)/75 p-4.5 shadow-[0_8px_22px_rgba(17,24,39,0.045)]">
            <span
              className="grid size-8.5 shrink-0 place-items-center rounded-[10px] bg-(--gray-50) text-[1.05rem]"
              aria-hidden="true"
            >
              🌱
            </span>
            <div>
              <h2 className="mt-px mb-1.25 text-[0.92rem] font-extrabold text-(--gray-900)">
                Une pause qui compte
              </h2>
              <p className="text-[0.76rem] leading-normal text-(--gray-600)">
                Chaque période sans écran rapporte de l&apos;Offlinium pour
                construire et accélérer le développement de votre planète.
              </p>
            </div>
          </article>

          <article className="flex items-start gap-3.25 rounded-[17px] border border-(--gray-100) bg-(--surface)/75 p-4.5 shadow-[0_8px_22px_rgba(17,24,39,0.045)]">
            <span
              className="grid size-8.5 shrink-0 place-items-center rounded-[10px] bg-(--gray-50) text-[1.05rem]"
              aria-hidden="true"
            >
              📲
            </span>
            <div>
              <h2 className="mt-px mb-1.25 text-[0.92rem] font-extrabold text-(--gray-900)">
                À utiliser sur mobile
              </h2>
              <p className="text-[0.76rem] leading-normal text-(--gray-600)">
                Offliner s&apos;installe sur votre téléphone comme une
                application, sans passer par un store. Nous vous guidons à
                l&apos;étape suivante.
              </p>
            </div>
          </article>
        </section>

        <p className="px-0 pt-4.5 pb-1 text-center text-[0.68rem] text-(--gray-600)">
          Gratuit · Sans compte · Sans serveur · Vos données restent sur votre appareil
        </p>
        <p className="m-0 pb-1 text-center text-[0.68rem] text-(--gray-600)">
          <LegalNoticeLink />
        </p>
      </div>
    </main>
  );
}
