import { useOnlineStatus } from "../stores/onlineStatusStore";
import { formatDate, formatDuration } from "../utils/format";
import Card from "./ui/Card";

export default function Status() {
  const isOnline = useOnlineStatus((state) => state.isOnline);
  const lastChecked = useOnlineStatus((state) => state.lastChecked);
  const totalOfflineMs = useOnlineStatus((state) => state.totalOfflineMs);

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
      </div>
    </Card>
  );
}
