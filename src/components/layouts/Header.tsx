import { useUser } from "../../stores/userStore";
import ResourceBar from "../ResourceBar";
import ColonySelector from "./ColonySelector";
import { useOnlineStatus } from "../../stores/onlineStatusStore";
import { formatAmount } from "../../models/resources";

export default function Header({
  isMenuOpen,
  onMenuOpen,
}: {
  isMenuOpen: boolean;
  onMenuOpen: () => void;
}) {
  const notablesToCustomize = useUser((state) => state.user.notablesToCustomize);
  const score = useUser((state) => state.user.score);
  const offlineCountdownMs = useOnlineStatus(
    (state) => state.offlineCountdownMs,
  );

  return (
    <header className="text-center px-5 pt-9 pb-5 max-w-270 mx-auto w-full max-md:px-4 max-md:pt-5 max-md:pb-4">
      <div className="flex justify-end items-center mb-2 gap-3 max-md:gap-2.5">
        <button
          className="relative hidden max-md:block max-md:mr-auto w-11 h-11 p-0 border border-(--gray-200) rounded-[13px] bg-white/80 text-(--gray-800) cursor-pointer font-[inherit] text-[1.25rem] leading-none"
          type="button"
          onClick={onMenuOpen}
          aria-label={
            notablesToCustomize > 0
              ? `Ouvrir le menu, ${notablesToCustomize} habitant${notablesToCustomize > 1 ? "s" : ""} à personnaliser`
              : "Ouvrir le menu"
          }
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          aria-controls="app-navigation"
        >
          <span aria-hidden="true">☰</span>
          {notablesToCustomize > 0 && (
            <span
              className="absolute -top-1 -right-1 size-3.5 rounded-full border-2 border-(--page-bg) bg-(--green-solid)"
              aria-hidden="true"
            />
          )}
        </button>
        <span
          className="rounded-full border border-(--gray-200) bg-yellow-50 px-3 py-1 font-(--mono) text-[0.8rem] font-bold whitespace-nowrap text-yellow-700"
          title="Score : 1 point pour 1000 ressources investies (l'Offlinium compte double)"
          aria-label={`Score : ${formatAmount(score)} points`}
        >
          🏆 {formatAmount(score)} pts
        </span>
        <div className="flex items-center gap-2">
          <h1 className="text-[2rem] max-md:text-[1.7rem] font-extrabold m-0">
            Offliner
          </h1>
          <img
            className="size-10 object-contain"
            src="/icons/logo.svg"
            alt=""
            aria-hidden="true"
          />
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <ColonySelector />
        <ResourceBar />
      </div>
      {offlineCountdownMs !== null && (
        <div
          className="flex items-center justify-center gap-2 mt-3.5 mx-auto px-3.5 py-2.5 border border-red-800/20 rounded-xl bg-red-100/80 text-(--red-dark) text-[0.82rem] font-semibold max-md:flex-wrap max-md:gap-x-2 max-md:gap-y-1"
          role="status"
          aria-live="polite"
        >
          <span>Enregistrement de la période dans</span>
          <strong className="min-w-[2.2ch] font-(--mono) text-base tabular-nums">
            {Math.ceil(offlineCountdownMs / 1000)} s
          </strong>
          <small className="text-(--gray-700) text-[0.74rem] font-medium max-md:basis-full">
            Restez hors ligne pour la confirmer.
          </small>
        </div>
      )}
    </header>
  );
}
