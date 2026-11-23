import { useOnlineStatus } from "../stores/onlineStatusStore";
import { useUser } from "../stores/userStore";
import { formatDate, formatDuration } from "../utils/format";
import { NIGHT_CREDIT_CAP_MS, NIGHT_END_HOUR } from "../utils/constants";
import Card from "./ui/Card";

export default function Status() {
  const isOnline = useOnlineStatus((state) => state.isOnline);
  const lastChecked = useOnlineStatus((state) => state.lastChecked);
  const totalOfflineMs = useOnlineStatus((state) => state.totalOfflineMs);
  const periodList = useUser((state) => state.user.periodList);
  // At night, offline time only counts up to the night cap.
  const nightUsedMs =
    isOnline || !lastChecked ? null : periodList.getNightCreditUsedMs(lastChecked.getTime());
  const isNightCapReached = nightUsedMs !== null && nightUsedMs >= NIGHT_CREDIT_CAP_MS;

  return (
    <Card
      ariaLabel="Statut de la connexion"
      title={isOnline ? "En ligne" : "Hors ligne"}
      subtitle={
        isOnline
          ? "Votre appareil est connecté à Internet."
          : "Votre appareil n'est pas connecté à Internet."
      }
    >
      <div className="flex w-full flex-col gap-3 rounded-xl border border-(--gray-100) bg-(--gray-50) p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[0.85rem] font-medium text-(--gray-600)">
            Dernier contrôle
          </span>
          <span className="max-w-[60%] overflow-hidden text-ellipsis whitespace-nowrap text-right text-[0.85rem] font-semibold text-(--gray-800)">
            {formatDate(lastChecked)}
          </span>
        </div>
        <div className="-mx-4 flex items-center justify-between gap-3 border-y border-(--gray-100) bg-white px-4 py-3">
          <span className="text-[0.85rem] font-medium text-(--gray-600)">
            Temps total hors ligne
          </span>
          <span className="max-w-[60%] overflow-hidden text-ellipsis whitespace-nowrap text-right text-base font-bold text-(--gray-900)">
            {formatDuration(totalOfflineMs)}
          </span>
        </div>
        {nightUsedMs !== null && (
          <p
            className={`m-0 text-[0.8rem] leading-snug ${
              isNightCapReached ? "font-bold text-(--gray-900)" : "text-(--gray-600)"
            }`}
            role="status"
          >
            🌙{" "}
            {isNightCapReached
              ? `Les ${NIGHT_CREDIT_CAP_MS / 3_600_000} h de cette nuit sont comptées : le temps hors ligne reprendra à ${NIGHT_END_HOUR} h.`
              : `Cette nuit : ${formatDuration(nightUsedMs)} comptées sur ${NIGHT_CREDIT_CAP_MS / 3_600_000} h au maximum, jusqu'à ${NIGHT_END_HOUR} h.`}
          </p>
        )}
      </div>
    </Card>
  );
}
