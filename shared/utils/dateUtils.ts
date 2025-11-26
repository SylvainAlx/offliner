/**
 * Calcule le début et la fin de la semaine actuelle (lundi à dimanche)
 * @returns Un objet contenant les dates de début et fin au format YYYY-MM-DD
 */
export function getCurrentWeekRange(): { start: string; end: string } {
  const today = new Date();

  // Réinitialiser l'heure à minuit pour éviter les problèmes de fuseau horaire
  today.setHours(0, 0, 0, 0);

  // nombre de jours depuis lundi (0 = lundi, 6 = dimanche)
  const daysSinceMonday = (today.getDay() + 6) % 7;
  const firstDayOfWeek = new Date(today);
  firstDayOfWeek.setDate(today.getDate() - daysSinceMonday);

  const lastDayOfWeek = new Date(firstDayOfWeek);
  lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);

  // Format YYYY-MM-DD en tenant compte du fuseau local
  const formatDateLocal = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return {
    start: formatDateLocal(firstDayOfWeek),
    end: formatDateLocal(lastDayOfWeek),
  };
}
