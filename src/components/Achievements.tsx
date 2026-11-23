import { useMemo } from "react";
import { getAchievements, type AchievementCategory } from "../models/achievement";
import { useOnlineStatus } from "../stores/onlineStatusStore";
import { useUser } from "../stores/userStore";
import { formatDuration } from "../utils/format";
import Card from "./ui/Card";

const CATEGORY_CLASSES: Record<AchievementCategory, string> = {
  "Temps hors ligne": "bg-blue-50 text-blue-700",
  "Régularité": "bg-orange-50 text-orange-700",
  "Planète": "bg-green-50 text-green-700",
  "Exploration spatiale": "bg-purple-50 text-purple-700",
  "Habitants": "bg-amber-50 text-amber-700",
};

/** Display order of the categories, with the icon of their heading. */
const CATEGORIES: Array<{ name: AchievementCategory; icon: string; description: string }> = [
  { name: "Planète", icon: "🪐", description: "Bâtiments et population" },
  { name: "Exploration spatiale", icon: "🚀", description: "Expéditions, colonies et cargos" },
  { name: "Habitants", icon: "👑", description: "Le chef et les habitants de la semaine" },
  { name: "Temps hors ligne", icon: "⏱️", description: "Temps passé déconnecté" },
  { name: "Régularité", icon: "📅", description: "Déconnexions jour après jour" },
];

export default function Achievements() {
  const user = useUser((state) => state.user);
  const totalOfflineMs = useOnlineStatus((state) => state.totalOfflineMs);
  const achievements = useMemo(
    () => getAchievements(user, totalOfflineMs),
    [user, totalOfflineMs],
  );
  const unlockedCount = achievements.filter((achievement) => achievement.unlocked).length;

  return (
    <Card
      ariaLabel="Succès"
      title="Succès"
      subtitle="Chaque étape franchie donne une nouvelle raison de rester déconnecté."
    >
      <div className="w-full border-b border-(--gray-100) pb-3">
        <p className="m-0 text-[0.82rem] font-medium text-(--gray-600)">
          {unlockedCount} succès débloqué{unlockedCount > 1 ? "s" : ""} sur{" "}
          {achievements.length}
        </p>
      </div>

      {CATEGORIES.map((category) => {
        const items = achievements.filter(
          (achievement) => achievement.category === category.name,
        );
        if (items.length === 0) return null;
        const done = items.filter((achievement) => achievement.unlocked).length;

        return (
          <section
            key={category.name}
            className="flex w-full flex-col gap-2.5"
            aria-labelledby={`achievements-${category.name}`}
          >
            <header className="flex items-center gap-2.5">
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-lg text-base ${CATEGORY_CLASSES[category.name]}`}
                aria-hidden="true"
              >
                {category.icon}
              </span>
              <div className="min-w-0 flex-1">
                <h2
                  id={`achievements-${category.name}`}
                  className="m-0 text-[0.95rem] font-extrabold text-(--gray-900)"
                >
                  {category.name}
                </h2>
                <p className="m-0 text-[0.7rem] text-(--gray-600)">
                  {category.description}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 font-(--mono) text-[0.72rem] font-bold ${CATEGORY_CLASSES[category.name]}`}
              >
                {done} / {items.length}
              </span>
            </header>

            <div className="grid w-full gap-3 sm:grid-cols-2">
              {items.map((achievement) => {
                const progressLabel =
                  achievement.category === "Temps hors ligne"
                    ? `${formatDuration(achievement.progress)} / ${formatDuration(achievement.target)}`
                    : `${achievement.progress.toLocaleString("fr-FR")} / ${achievement.target.toLocaleString("fr-FR")}`;

                return (
                  <article
                    className={`flex gap-3 rounded-xl border p-3 transition-colors ${
                      achievement.unlocked
                        ? "border-green-200 bg-green-50/70"
                        : "border-(--gray-100) bg-(--gray-50)/60 opacity-80"
                    }`}
                    key={achievement.id}
                  >
                    <span
                      className={`grid size-11 shrink-0 place-items-center rounded-xl text-xl ${
                        achievement.unlocked ? "bg-white" : "bg-(--gray-100) grayscale"
                      }`}
                      aria-hidden="true"
                    >
                      {achievement.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="m-0 text-[0.9rem] font-extrabold text-(--gray-900)">
                        {achievement.title}
                      </h3>
                      <p className="mt-1.5 mb-0 text-[0.74rem] leading-snug text-(--gray-600)">
                        {achievement.description}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2 text-[0.68rem] font-semibold text-(--gray-600)">
                        <span>{achievement.unlocked ? "Débloqué" : "En cours"}</span>
                        <span className="font-(--mono)">{progressLabel}</span>
                      </div>
                      {!achievement.unlocked && (
                        <div
                          className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-(--gray-200)"
                          role="progressbar"
                          aria-label={`Progression : ${progressLabel}`}
                          aria-valuemax={achievement.target}
                          aria-valuemin={0}
                          aria-valuenow={achievement.progress}
                        >
                          <div
                            className="h-full rounded-full bg-(--green-primary) transition-[width] duration-300"
                            style={{
                              width: `${Math.min(100, (achievement.progress / achievement.target) * 100)}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </Card>
  );
}
