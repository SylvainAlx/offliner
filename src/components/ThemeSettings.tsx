import Card from "./ui/Card";
import { useTheme } from "../stores/themeStore";
import { THEME_LABELS, THEME_PREFERENCES } from "../utils/theme";

const ICONS = { system: "🖥️", light: "☀️", dark: "🌙" } as const;

export default function ThemeSettings() {
  const preference = useTheme((state) => state.preference);
  const setPreference = useTheme((state) => state.setPreference);

  return (
    <Card
      ariaLabel="Apparence"
      title="Apparence"
      subtitle="« Système » suit le réglage clair ou sombre de votre appareil."
    >
      <div
        className="grid w-full grid-cols-3 gap-2"
        role="radiogroup"
        aria-label="Thème"
      >
        {THEME_PREFERENCES.map((option) => {
          const selected = option === preference;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-[10px] border text-[0.85rem] font-bold focus-visible:outline-2 focus-visible:outline-(--accent) focus-visible:outline-offset-1 ${
                selected
                  ? "border-(--accent-solid) bg-(--accent-solid) text-(--on-color)"
                  : "border-(--gray-200) bg-(--surface) text-(--gray-700) hover:bg-(--gray-100)"
              }`}
              onClick={() => setPreference(option)}
            >
              <span aria-hidden="true">{ICONS[option]}</span>
              {THEME_LABELS[option]}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
