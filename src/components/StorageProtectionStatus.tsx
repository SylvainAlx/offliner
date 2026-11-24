import { useEffect, useState } from "react";
import { useBackup } from "../stores/backupStore";
import { useInstall } from "../stores/installStore";
import { useUser } from "../stores/userStore";
import { isBackupReminderDue } from "../models/backup";
import { formatDaysAgo } from "../utils/format";

/** Whether the browser keeps the save, and how old the last backup is. */
export default function StorageProtectionStatus() {
  const protection = useBackup((state) => state.protection);
  const lastBackupAt = useBackup((state) => state.lastBackupAt);
  const refreshProtection = useBackup((state) => state.refreshProtection);
  const requestProtection = useBackup((state) => state.requestProtection);
  const createdAt = useUser((state) => state.user.createdAt);
  const isStandalone = useInstall((state) => state.isStandalone);
  const [now] = useState(() => Date.now());
  const [isRequesting, setIsRequesting] = useState(false);
  const [wasRefused, setWasRefused] = useState(false);

  useEffect(() => {
    void refreshProtection();
  }, [refreshProtection]);

  const isBackupDue = isBackupReminderDue(
    { lastBackupAt, createdAt, snoozedUntil: null },
    now,
  );

  return (
    <div className="grid gap-2">
      {protection === "protected" && (
        <p className="m-0 rounded-[12px] border border-green-200 bg-(--green-bg) px-3.5 py-2.5 text-[0.8rem] leading-normal text-(--green-dark)">
          <strong>🛡️ Données protégées.</strong> Le navigateur ne les effacera
          pas pour libérer de la place. Seul un effacement manuel peut encore
          les supprimer.
        </p>
      )}
      {protection === "unprotected" && (
        <div className="grid gap-2 rounded-[12px] border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[0.8rem] leading-normal text-amber-900">
          <p className="m-0">
            <strong>⚠️ Protection non garantie.</strong> Le navigateur peut
            effacer vos données s'il manque de place
            {isStandalone ? "" : ", ou sur iPhone après 7 jours sans jouer"}.{" "}
            {isStandalone
              ? "Exportez régulièrement une sauvegarde."
              : "Installez l'app et exportez régulièrement une sauvegarde."}
          </p>
          <button
            type="button"
            className="min-h-10 w-fit cursor-pointer rounded-[10px] border border-amber-200 bg-transparent px-3 text-[0.78rem] font-bold text-amber-900 disabled:cursor-default disabled:opacity-60"
            disabled={isRequesting}
            onClick={async () => {
              setIsRequesting(true);
              const result = await requestProtection(true);
              setWasRefused(result !== "protected");
              setIsRequesting(false);
            }}
          >
            Demander la protection au navigateur
          </button>
          {wasRefused && (
            <p className="m-0" role="status">
              Le navigateur a refusé pour l'instant : il en décide selon votre
              usage (app installée, visites régulières). Réessayez plus tard.
            </p>
          )}
        </div>
      )}
      {protection === "unsupported" && (
        <p className="m-0 rounded-[12px] border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[0.8rem] leading-normal text-amber-900">
          <strong>⚠️ Protection indisponible.</strong> Ce navigateur ne permet
          pas de protéger vos données : exportez régulièrement une sauvegarde.
        </p>
      )}

      <p
        className={`m-0 text-[0.8rem] leading-normal ${
          isBackupDue ? "font-bold text-(--red-dark)" : "text-(--gray-600)"
        }`}
      >
        💾 Dernière sauvegarde :{" "}
        {lastBackupAt === null
          ? "jamais sur cet appareil"
          : formatDaysAgo(lastBackupAt, now)}
        {isBackupDue && " — pensez à en faire une."}
      </p>
    </div>
  );
}
