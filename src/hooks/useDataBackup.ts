import { useRef, useState, type ChangeEvent } from "react";
import { useOnlineStatus } from "../stores/onlineStatusStore";
import { useUser } from "../stores/userStore";
import { userRepository } from "../services/userRepository";
import { MAX_BACKUP_FILE_BYTES } from "../utils/constants";
import { downloadJson, getBackupFileName } from "../utils/download";

export function useDataBackup() {
  const saveUser = useUser((state) => state.saveUser);
  const importFromSnapshot = useUser((state) => state.importFromSnapshot);
  const resetAll = useUser((state) => state.resetAll);
  const refreshOnlineStatus = useOnlineStatus((state) => state.refreshFromUser);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  type Feedback = {
    kind: "success" | "error";
    message: string;
  };

  function isBackupData(value: unknown): value is Record<string, unknown> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return false;
    }

    const record = value as Record<string, unknown>;
    const periodList = record.periodList;
    const village = record.village;

    if (
      typeof record.name !== "string" ||
      typeof record.createdAt !== "number" ||
      !Number.isFinite(record.createdAt) ||
      typeof record.offlinium !== "number" ||
      !Number.isFinite(record.offlinium) ||
      typeof periodList !== "object" ||
      periodList === null ||
      typeof village !== "object" ||
      village === null
    ) {
      return false;
    }

    const periodRecord = periodList as Record<string, unknown>;
    const villageRecord = village as Record<string, unknown>;

    return (
      Array.isArray(periodRecord.days) &&
      Array.isArray(villageRecord.companions) &&
      Array.isArray(villageRecord.houses) &&
      Array.isArray(villageRecord.pendingElements)
    );
  }

  async function handleExport() {
    if (typeof window === "undefined") return;

    await saveUser();
    const data = await userRepository.exportSnapshot();

    if (!data) {
      setFeedback({
        kind: "error",
        message: "Impossible de lire les données du compte.",
      });
      return;
    }

    downloadJson(data, getBackupFileName());

    setFeedback({
      kind: "success",
      message: "Sauvegarde exportée. Conservez ce fichier précieusement.",
    });
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > MAX_BACKUP_FILE_BYTES) {
      setFeedback({
        kind: "error",
        message: "Ce fichier est trop volumineux pour être une sauvegarde Offliner.",
      });
      return;
    }

    try {
      const parsedData: unknown = JSON.parse(await file.text());

      if (!isBackupData(parsedData)) {
        throw new Error("format");
      }

      await saveUser();
      await importFromSnapshot(parsedData);
      refreshOnlineStatus();
      setFeedback({
        kind: "success",
        message: "Compte restauré avec succès.",
      });
    } catch (error) {
      if (error instanceof Error && error.message === "format") {
        setFeedback({
          kind: "error",
          message: "Ce fichier ne ressemble pas à une sauvegarde Offliner.",
        });
        return;
      }

      setFeedback({
        kind: "error",
        message: "Import impossible. Vérifiez le fichier et réessayez.",
      });
    }
  }

  async function handleClearAll() {
    if (typeof window === "undefined") return;

    await resetAll();
    refreshOnlineStatus();
    setFeedback({
      kind: "success",
      message: "Compte effacé avec succès.",
    });
  }

  return {
    feedback,
    fileInputRef,
    handleExport,
    handleImport,
    handleClearAll,
    isResetModalOpen,
    setIsResetModalOpen,
    isImportModalOpen,
    setIsImportModalOpen,
    isExportModalOpen,
    setIsExportModalOpen,
  };
}
