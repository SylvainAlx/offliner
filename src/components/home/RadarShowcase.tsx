import { useMemo } from "react";
import type { HomeScene } from "../../hooks/useHomePage";
import { decodeSignal, encodeSignal } from "../../models/signal";
import { generatePlanetSprite } from "../../utils/planetSprite";
import SignalCard from "../radar/SignalCard";
import QrCode from "../install/QrCode";

const STEPS = [
  {
    icon: "✍️",
    title: "Écrivez",
    text: "Choisissez votre planète, un de vos habitants célèbres pour signer, et votre message.",
  },
  {
    icon: "📤",
    title: "Transmettez",
    text: "Le radar en fait un code et un QR code : envoyez-les par message, e-mail, réseau social, ou montrez votre écran.",
  },
  {
    icon: "📡",
    title: "Captez",
    text: "Vos amis collent le code ou photographient le QR code : le signal arrive sur leur planète, avec le portrait de son auteur.",
  },
];

/**
 * The radar, the game's other side: players talk from planet to planet
 * without any server. A real sample signal, drawn with the home scene, shows
 * what one looks like; its QR code can be captured in the game.
 */
export default function RadarShowcase({ scene }: { scene: HomeScene }) {
  const sample = useMemo(() => {
    const code = encodeSignal({
      planetName: scene.planetName,
      planetSeed: scene.planetSeed,
      planetKind: generatePlanetSprite(scene.planetSeed).kind,
      authorName: scene.leaderName,
      authorTitle: "Chef planétaire",
      authorSeed: scene.inhabitantIds[0],
      message: scene.message,
      sentAt: scene.drawnAt,
    });
    const decoded = decodeSignal(code);
    return decoded.ok ? { code, signal: decoded.signal } : null;
  }, [scene]);

  return (
    <section
      className="my-10 grid grid-cols-[minmax(0,1fr)_minmax(300px,0.9fr)] items-center gap-[clamp(24px,5vw,64px)] rounded-[28px] border border-(--accent-border) bg-(--surface)/80 p-[clamp(20px,4vw,40px)] shadow-[0_18px_40px_rgba(65,18,100,0.08)] max-[760px]:my-7 max-[760px]:grid-cols-1"
      aria-labelledby="home-radar-title"
    >
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-(--accent-bg) px-3 py-1 text-[0.72rem] font-extrabold tracking-wide text-(--accent) uppercase">
          📡 Le radar
        </span>
        <h2
          id="home-radar-title"
          className="mt-3 mb-3 text-[clamp(1.6rem,3.4vw,2.4rem)] leading-[1.05] font-extrabold tracking-[-0.04em] text-(--gray-900)"
        >
          Parlez aux autres planètes,
          <br />
          <span className="text-(--accent)">sans serveur.</span>
        </h2>
        <p className="m-0 mb-5 max-w-130 text-[0.92rem] leading-[1.6] text-(--gray-600)">
          Construisez un radar et échangez des signaux avec les planètes de vos amis. Pas de
          compte, pas de serveur : c&apos;est vous qui choisissez comment le message voyage.
        </p>
        <ol className="m-0 flex list-none flex-col gap-3 p-0">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex items-start gap-3">
              <span
                className="grid size-9 shrink-0 place-items-center rounded-xl bg-(--gray-50) text-[1.05rem]"
                aria-hidden="true"
              >
                {step.icon}
              </span>
              <div>
                <h3 className="m-0 text-[0.9rem] font-extrabold text-(--gray-900)">
                  {index + 1}. {step.title}
                </h3>
                <p className="m-0 text-[0.78rem] leading-normal text-(--gray-600)">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {sample && (
        <figure className="m-0 flex flex-col items-center gap-3">
          <SignalCard signal={sample.signal} />
          <div className="flex w-full items-center gap-4 rounded-2xl border border-dashed border-(--accent-border) p-3 max-[430px]:flex-col max-[430px]:text-center">
            <div className="shrink-0 rounded-xl bg-white p-1.5">
              <QrCode
                value={sample.code}
                size={176}
                label={`QR code du signal de ${sample.signal.planetName}`}
              />
            </div>
            <figcaption className="text-[0.76rem] leading-normal text-(--gray-600)">
              <strong className="block text-(--gray-900)">Un vrai signal</strong>
              Une fois votre radar construit, photographiez ce QR code dans l&apos;onglet
              Communications : {sample.signal.authorName} vous écrit depuis{" "}
              {sample.signal.planetName}.
            </figcaption>
          </div>
        </figure>
      )}
    </section>
  );
}
