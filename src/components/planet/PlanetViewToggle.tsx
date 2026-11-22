export type PlanetView = "surface" | "list";

const OPTIONS: Array<{ view: PlanetView; label: string; icon: string }> = [
  { view: "surface", label: "Surface", icon: "🪐" },
  { view: "list", label: "Liste", icon: "☰" },
];

const STORAGE_KEY = "offliner:planet-view";

/** The view last chosen on this device; the surface by default. */
export function loadPlanetView(): PlanetView {
  try {
    return localStorage.getItem(STORAGE_KEY) === "list" ? "list" : "surface";
  } catch {
    return "surface";
  }
}

export function savePlanetView(view: PlanetView): void {
  try {
    localStorage.setItem(STORAGE_KEY, view);
  } catch {
    // Storage unavailable: the choice lasts for this visit.
  }
}

export default function PlanetViewToggle({
  view,
  onChange,
}: {
  view: PlanetView;
  onChange: (view: PlanetView) => void;
}) {
  return (
    <div
      className="ml-auto inline-flex rounded-full border border-(--gray-200) bg-(--surface) p-0.5"
      role="radiogroup"
      aria-label="Affichage des bâtiments"
    >
      {OPTIONS.map((option) => {
        const selected = option.view === view;
        return (
          <button
            key={option.view}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`min-h-8 cursor-pointer rounded-full px-3 text-[0.75rem] font-bold focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-1 ${
              selected
                ? "bg-(--accent-solid) text-(--on-color)"
                : "text-(--gray-700) hover:bg-(--gray-100)"
            }`}
            onClick={() => onChange(option.view)}
          >
            <span aria-hidden="true">{option.icon}</span> {option.label}
          </button>
        );
      })}
    </div>
  );
}
