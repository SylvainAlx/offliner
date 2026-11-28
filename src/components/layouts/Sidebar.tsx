import { useSideBar } from "../../hooks/useSideBar";
import { useUser } from "../../stores/userStore";

export type AppSection =
  | "account"
  | "planet"
  | "inhabitants"
  | "system"
  | "radar"
  | "achievements"
  | "help"
  | "support";

const menuItems: Array<{
  id: AppSection;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    id: "planet",
    label: "Planète",
    description: "Bâtiments et ressources",
    icon: "🪐",
  },
  {
    id: "inhabitants",
    label: "Habitants",
    description: "Chef et célébrités",
    icon: "👑",
  },
  {
    id: "system",
    label: "Système",
    description: "Votre système et ses voisins",
    icon: "☀️",
  },
  {
    id: "radar",
    label: "Communications",
    description: "Signaux entre joueurs",
    icon: "📡",
  },
  {
    id: "achievements",
    label: "Succès",
    description: "Vos étapes et records",
    icon: "🏆",
  },
  {
    id: "account",
    label: "Compte",
    description: "Profil, statut et suivi",
    icon: "👤​",
  },
  {
    id: "help",
    label: "Aide",
    description: "Les règles d'Offliner",
    icon: "?",
  },
  {
    id: "support",
    label: "Contact et soutien",
    description: "Votre avis et vos dons",
    icon: "❤️",
  },
];

type SidebarProps = {
  activeSection: AppSection;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (section: AppSection) => void;
};

export default function Sidebar({
  activeSection,
  isOpen,
  onClose,
  onSelect,
}: SidebarProps) {
  // The star system opens once the spaceport is built.
  const isSystemUnlocked = useUser((state) => state.user.isSystemUnlocked);
  const isRadarBuilt = useUser((state) => state.user.isRadarBuilt);
  // Inhabitants who arrived and still wait for the player to tell their story.
  const notablesToCustomize = useUser(
    (state) => state.user.notablesToCustomize,
  );
  const { closeButtonRef, handleSelect } = useSideBar(
    isOpen,
    onClose,
    onSelect,
  );

  return (
    <>
      {/* Backdrop — desktop: hidden, mobile: fixed overlay */}
      <div
        className={[
          "hidden",
          // mobile
          "max-md:block max-md:fixed max-md:inset-0 max-md:z-20 max-md:bg-black/50 max-md:transition-opacity max-md:duration-240 max-md:ease-[ease]",
          // Only one pointer-events class at a time: with both, the order of
          // the generated CSS decides, and clicks went through the backdrop.
          isOpen
            ? "max-md:opacity-100 max-md:pointer-events-auto max-md:cursor-pointer"
            : "max-md:opacity-0 max-md:pointer-events-none",
        ].join(" ")}
        aria-hidden="true"
        onClick={onClose}
      />

      <aside
        id="app-navigation"
        className={[
          // Desktop layout
          "relative z-10 flex flex-col w-63.75 min-w-63.75 p-[22px_14px]",
          "border border-green-700/10 rounded-[22px] bg-white/80 backdrop-blur-sm",
          "shadow-(--shadow-md)",
          // Mobile overrides — slide-in drawer
          "max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-30",
          "max-md:w-[min(86vw,340px)] max-md:min-w-0 max-md:p-[24px_15px]",
          "max-md:border-0 max-md:rounded-none max-md:rounded-r-[26px]",
          "max-md:bg-white/97 max-md:shadow-[14px_0_40px_rgba(17,24,39,0.16)]",
          "max-md:overflow-y-auto",
          "max-md:transition-transform max-md:duration-240 max-md:ease-[ease]",
          isOpen ? "max-md:translate-x-0" : "max-md:translate-x-[-105%]",
        ].join(" ")}
        aria-label="Navigation principale"
      >
        {/* Heading row */}
        <div className="flex items-start justify-between gap-3 px-2 pb-4.5">
          <h2 className="block mb-0.5 text-(--green-dark) text-[0.68rem] font-black tracking-widest uppercase m-0">
            Navigation
          </h2>
          <button
            ref={closeButtonRef}
            className="hidden max-md:block w-10 h-10 border-0 rounded-xl bg-(--gray-50) text-(--gray-700) cursor-pointer font-[inherit] text-[1.65rem] leading-none"
            type="button"
            onClick={onClose}
            aria-label="Fermer le menu"
          >
            ×
          </button>
        </div>

        {/* Nav items */}
        <nav className="grid gap-1.75">
          {menuItems.map((menuItem) => {
            // A section opens once the building it needs exists.
            const lockedBy =
              menuItem.id === "system" && !isSystemUnlocked
                ? "le spatioport"
                : menuItem.id === "radar" && !isRadarBuilt
                  ? "le radar"
                  : null;
            const isLocked = lockedBy !== null;
            const item = isLocked
              ? {
                  ...menuItem,
                  icon: "🔒",
                  description: `Construisez ${lockedBy}`,
                }
              : menuItem;
            const isActive = activeSection === item.id;
            const badge = item.id === "inhabitants" ? notablesToCustomize : 0;
            return (
              <button
                className={[
                  "flex items-center gap-2.75 w-full min-h-16.5 max-md:min-h-17.5",
                  "px-2.75 py-2.5 border rounded-[15px] bg-transparent",
                  "text-left cursor-pointer font-[inherit]",
                  "transition-all duration-180 ease-[ease]",
                  isLocked ? "opacity-60" : "",
                  isActive
                    ? "border-green-500/20 bg-(--green-bg) text-(--green-dark)"
                    : "border-transparent text-(--gray-700) hover:border-(--gray-200) hover:bg-(--gray-50) hover:translate-x-0.5",
                ].join(" ")}
                type="button"
                aria-current={isActive ? "page" : undefined}
                aria-label={
                  isLocked
                    ? `${item.label} : verrouillé, construisez ${lockedBy}`
                    : badge > 0
                      ? `${item.label} : ${badge} à personnaliser`
                      : undefined
                }
                key={item.id}
                onClick={() => handleSelect(item.id)}
              >
                <span
                  className="grid flex-none place-items-center w-8.75 h-8.75 rounded-[11px] bg-white/90 text-(--green-dark) text-[1.15rem] font-black"
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
                <span className="grid min-w-0 flex-1 gap-px">
                  <strong className="text-(--gray-900) text-[0.9rem] font-black">
                    {item.label}
                  </strong>
                  <small className="overflow-hidden text-(--gray-600) text-[0.7rem] leading-[1.3] text-ellipsis whitespace-nowrap">
                    {item.description}
                  </small>
                </span>
                {badge > 0 && (
                  <span
                    className="grid min-w-5.5 h-5.5 flex-none place-items-center rounded-full bg-(--green-solid) px-1.5 text-[0.7rem] font-black text-(--on-color)"
                    aria-hidden="true"
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
