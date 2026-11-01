import { useMemo } from "react";
import { getAchievements, type AchievementCategory } from "../models/achievement";
import { useOnlineStatus } from "../stores/onlineStatusStore";
import { useUser } from "../stores/userStore";
import { formatDuration } from "../utils/format";
import Card from "./ui/Card";

const CATEGORY_CLASSES: Record<AchievementCategory, string> = {
  "Temps hors ligne": "bg-blue-50 text-blue-700",
  "Régularité": "bg-orange-50 text-orange-700",
  Village: "bg-green-50 text-green-700",
};

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

      <div className="grid w-full gap-3 sm:grid-cols-2">
        {achievements.map((achievement) => {
          const progressLabel =
            achievement.category === "Temps hors ligne"
              ? `${formatDuration(achievement.progress)} / ${formatDuration(achievement.target)}`
              : `${achievement.progress} / ${achievement.target}`;

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
                <div className="flex items-start justify-between gap-2">
                  <h2 className="m-0 text-[0.9rem] font-extrabold text-(--gray-900)">
                    {achievement.title}
                  </h2>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[0.58rem] font-extrabold uppercase ${CATEGORY_CLASSES[achievement.category]}`}
                  >
                    {achievement.category}
                  </span>
                </div>
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
                        width: `${(achievement.progress / achievement.target) * 100}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </Card>
  );
}
