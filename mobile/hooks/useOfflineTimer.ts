import { useEffect, useState } from "react";
import { useOfflineProgress } from "@/contexts/OfflineProgressContext";

/**
 * Hook pour afficher un compteur temps réel du temps hors ligne
 * Optimisé pour éviter les re-renders du contexte global
 *
 * @returns Les stats avec le temps écoulé en temps réel depuis le début de la période
 */
export const useOfflineTimer = () => {
  const { unsyncStats, isOnline, currentPeriodStart } = useOfflineProgress();
  const [liveStats, setLiveStats] = useState(unsyncStats);

  useEffect(() => {
    // Si on est en ligne ou pas de période en cours, on utilise les stats persistées
    if (isOnline || !currentPeriodStart) {
      setLiveStats(unsyncStats);
      return;
    }

    // Calcul initial du temps écoulé
    const startTime = new Date(currentPeriodStart).getTime();
    const updateLiveStats = () => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - startTime) / 1000);

      setLiveStats({
        daily: unsyncStats.daily + elapsedSeconds,
        weekly: unsyncStats.weekly + elapsedSeconds,
        total: unsyncStats.total + elapsedSeconds,
      });
    };

    // Mise à jour initiale
    updateLiveStats();

    // Mise à jour toutes les secondes (seulement pour ce composant)
    const interval = setInterval(updateLiveStats, 1000);

    return () => clearInterval(interval);
  }, [unsyncStats, isOnline, currentPeriodStart]);

  return liveStats;
};
