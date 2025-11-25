import { useState, useEffect } from "react";
import { useSession } from "@/contexts/SessionContext";
import { updateDailyGoal } from "@/api/users";
import { showMessage } from "@/utils/formatNotification";

export const useDailyGoal = () => {
  const { session, dailyGoalSeconds, setDailyGoalSeconds } = useSession();
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Synchroniser les inputs avec l'objectif actuel
  useEffect(() => {
    if (dailyGoalSeconds !== null) {
      const h = Math.floor(dailyGoalSeconds / 3600);
      const m = Math.floor((dailyGoalSeconds % 3600) / 60);
      setHours(h.toString());
      setMinutes(m.toString());
    }
  }, [dailyGoalSeconds]);

  const handleSave = async () => {
    if (!session) {
      showMessage("Vous devez être connecté", "error", "Erreur");
      return;
    }

    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;

    if (h === 0 && m === 0) {
      showMessage("Veuillez définir un objectif valide", "info", "Attention");
      return;
    }

    const totalSeconds = h * 3600 + m * 60;

    try {
      setIsSaving(true);
      await updateDailyGoal(session, totalSeconds);
      setDailyGoalSeconds(totalSeconds);
      showMessage(
        "Objectif quotidien enregistré avec succès",
        "success",
        "Succès",
      );
    } catch (error) {
      showMessage(
        "Erreur lors de l'enregistrement de l'objectif",
        "error",
        "Erreur",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!session) {
      showMessage("Vous devez être connecté", "error", "Erreur");
      return;
    }

    try {
      setIsSaving(true);
      await updateDailyGoal(session, null);
      setDailyGoalSeconds(null);
      setHours("");
      setMinutes("");
      showMessage("Objectif quotidien supprimé", "success", "Succès");
    } catch (error) {
      showMessage(
        "Erreur lors de la suppression de l'objectif",
        "error",
        "Erreur",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return {
    hours,
    setHours,
    minutes,
    setMinutes,
    isSaving,
    dailyGoalSeconds,
    session,
    handleSave,
    handleRemove,
  };
};
