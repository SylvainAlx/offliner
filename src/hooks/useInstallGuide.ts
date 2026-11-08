import { useState } from "react";
import { useInstall } from "../stores/installStore";
import { useUser } from "../stores/userStore";
import { userRepository } from "../services/userRepository";
import { downloadJson, getBackupFileName } from "../utils/download";

export type InstallFeedback = { kind: "success" | "error"; message: string };

export function useInstallGuide() {
  const platform = useInstall((state) => state.platform);
  const canPrompt = useInstall((state) => state.canPrompt);
  const justInstalled = useInstall((state) => state.justInstalled);
  const promptInstall = useInstall((state) => state.promptInstall);
  const hasProgress = useUser((state) => {
    const { user } = state;
    return (
      user.offlinium > 0 ||
      user.periodList.days.length > 0 ||
      user.periodList.openPeriodStart !== null ||
      user.village.houses.length > 0
    );
  });
  const [feedback, setFeedback] = useState<InstallFeedback | null>(null);

  const appUrl =
    typeof window === "undefined" ? "" : `${window.location.origin}/`;

  async function install() {
    const outcome = await promptInstall();
    if (outcome === "dismissed") {
      setFeedback({
        kind: "error",
        message: "Installation annulée. Vous pouvez réessayer à tout moment.",
      });
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(appUrl);
      setFeedback({ kind: "success", message: "Lien copié." });
    } catch {
      setFeedback({ kind: "error", message: `Copiez ce lien : ${appUrl}` });
    }
  }

  // On iPhone, an app added to the home screen may not share the storage of
  // Safari: progress made in the browser has to be carried over by a backup.
  async function exportProgress() {
    await useUser.getState().saveUser();
    const data = await userRepository.exportSnapshot();
    if (!data) {
      setFeedback({ kind: "error", message: "Aucune progression à exporter." });
      return;
    }
    downloadJson(data, getBackupFileName());
    setFeedback({
      kind: "success",
      message:
        "Sauvegarde exportée. Importez-la ensuite dans l'app installée (Compte › Données du compte).",
    });
  }

  return {
    platform,
    canPrompt,
    justInstalled,
    hasProgress,
    appUrl,
    feedback,
    install,
    copyLink,
    exportProgress,
  };
}
