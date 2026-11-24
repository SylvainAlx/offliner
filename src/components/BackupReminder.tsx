import { useEffect, useState } from "react";
import { useBackup } from "../stores/backupStore";
import { useUser } from "../stores/userStore";
import { isBackupReminderDue } from "../models/backup";
import { formatDaysAgo } from "../utils/format";

const CHECK_INTERVAL_MS = 60 * 60 * 1000;

/** Suggests a backup when the last one is a week old (or was never made). */
export default function BackupReminder({ onOpenAccount }: { onOpenAccount: () => void }) {
  const lastBackupAt = useBackup((state) => state.lastBackupAt);
  const snoozedUntil = useBackup((state) => state.snoozedUntil);
  const snoozeReminder = useBackup((state) => state.snoozeReminder);
  const createdAt = useUser((state) => state.user.createdAt);
  const [now, setNow] = useState(() => Date.now());

  // The app can stay open for days: check again from time to time.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  if (!isBackupReminderDue({ lastBackupAt, createdAt, snoozedUntil }, now)) return null;

  return (
    <div
      className="mx-auto mb-4 flex w-[min(calc(100%-32px),1080px)] items-center gap-3 rounded-[14px] border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[0.84rem] text-amber-900 shadow-(--shadow-sm)"
      role="region"
      aria-label="Sauvegarder la partie"
    >
      <span className="text-[1.4rem]" aria-hidden="true">
        💾
      </span>
      <p className="m-0 flex-1">
        {lastBackupAt === null
          ? "Aucune sauvegarde de votre partie : une copie la met à l'abri si le navigateur efface ses données."
          : `Dernière sauvegarde ${formatDaysAgo(lastBackupAt, now)} : pensez à mettre votre partie à l'abri.`}
      </p>
      <button
        type="button"
        className="min-h-11 shrink-0 cursor-pointer rounded-[10px] border-0 bg-(--accent-solid) px-3.5 text-[0.82rem] font-bold text-(--on-color)"
        onClick={onOpenAccount}
      >
        Sauvegarder
      </button>
      <button
        type="button"
        className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-[10px] border-0 bg-transparent text-[1.3rem] text-amber-900 hover:bg-amber-200/40"
        aria-label="Me le rappeler dans 3 jours"
        title="Me le rappeler dans 3 jours"
        onClick={() => snoozeReminder(Date.now())}
      >
        ×
      </button>
    </div>
  );
}
