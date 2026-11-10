import { useEffect, useState, type FormEvent } from "react";
import type { Companion } from "../models/companion";
import { useOnlineStatus } from "../stores/onlineStatusStore";
import { useUser } from "../stores/userStore";

export function useCompanionTile(companion: Companion) {
  const [isSpriteOpen, setIsSpriteOpen] = useState(false);
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [companionName, setCompanionName] = useState(companion.name);
  const [isNameSaved, setIsNameSaved] = useState(false);
  const canRenameCompanion = useUser(
    (state) => state.user.village.townHall !== null,
  );
  const renameCompanion = useUser((state) => state.renameCompanion);
  const releaseCompanionAndGetOfflinium = useUser(
    (state) => state.releaseCompanionAndGetOfflinium,
  );
  const totalOfflineMs = useOnlineStatus((state) => state.totalOfflineMs);

  function handleRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = companionName.trim();
    if (!trimmedName) return;

    if (renameCompanion(companion.id, trimmedName)) {
      setCompanionName(trimmedName);
      setIsNameSaved(true);
    }
  }

  useEffect(() => {
    if (!isSpriteOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsSpriteOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSpriteOpen]);

  return {
    isSpriteOpen,
    setIsSpriteOpen,
    isReleaseModalOpen,
    setIsReleaseModalOpen,
    remainingOfflineMs: companion.getRemainingOfflineMs(totalOfflineMs),
    canRenameCompanion,
    companionName,
    setCompanionName,
    isNameSaved,
    setIsNameSaved,
    handleRename,
    releaseCompanionAndGetOfflinium: (companionId: string) =>
      releaseCompanionAndGetOfflinium(companionId, totalOfflineMs),
  };
}
