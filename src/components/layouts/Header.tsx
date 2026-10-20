import OffliniumBadge from "../OffliniumBadge";
import PopulationBadge from "../PopulationBadge";
import { useOnlineStatus } from "../../stores/onlineStatusStore";

export default function Header({
  isMenuOpen,
  onMenuOpen,
}: {
  isMenuOpen: boolean;
  onMenuOpen: () => void;
}) {
  const offlineCountdownMs = useOnlineStatus(
    (state) => state.offlineCountdownMs,
  );

  return (
    <header className="text-center px-5 pt-9 pb-5 max-w-270 mx-auto w-full max-md:px-4 max-md:pt-5 max-md:pb-4">
      <div className="flex justify-between items-center mb-2 max-md:gap-2.5">
        <button
          className="hidden max-md:block w-11 h-11 p-0 border border-(--gray-200) rounded-[13px] bg-white/80 text-(--gray-800) cursor-pointer font-[inherit] text-[1.25rem] leading-none"
          type="button"
          onClick={onMenuOpen}
          aria-label="Ouvrir le menu"
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          aria-controls="app-navigation"
        >
          <span aria-hidden="true">☰</span>
        </button>
        <div className="flex items-center gap-2 max-md:mr-auto">
          <img
            className="hidden lg:block size-10 object-contain"
            src="/logo.png"
            alt=""
            aria-hidden="true"
          />
          <h1 className="text-[2rem] max-md:text-[1.7rem] font-extrabold m-0">
            Offliner
          </h1>
        </div>
        <div className="flex items-center gap-2 max-md:gap-1.5">
          <PopulationBadge />
          <OffliniumBadge />
        </div>
      </div>
      <p className="m-0 text-(--gray-600) text-[0.95rem] font-medium text-left">
        Votre village hors-ligne
      </p>
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
