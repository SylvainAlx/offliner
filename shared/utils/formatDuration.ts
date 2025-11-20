export function formatDuration(
  seconds: number,
  fullText: boolean = false,
): string {
  const days = Math.floor(seconds / 86400);
  seconds %= 86400;

  const years = Math.floor(days / 365);
  const daysAfterYears = days % 365;

  const months = Math.floor(daysAfterYears / 30);
  const remainingDays = daysAfterYears % 30;

  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  const parts: string[] = [];

  if (fullText) {
    if (years > 0) parts.push(`${years} année${years > 1 ? "s" : ""}`);
    if (months > 0) parts.push(`${months} mois`);
    if (remainingDays > 0)
      parts.push(`${remainingDays} jour${remainingDays > 1 ? "s" : ""}`);
    if (hours > 0) parts.push(`${hours} heure${hours > 1 ? "s" : ""}`);
    if (mins > 0) parts.push(`${mins} minute${mins > 1 ? "s" : ""}`);
    if (secs > 0 || parts.length === 0)
      parts.push(`${secs} seconde${secs > 1 ? "s" : ""}`);
    return parts.join(" ");
  } else {
    if (years > 0) parts.push(`${years}a`); // années
    if (months > 0) parts.push(`${months}m`); // mois
    if (remainingDays > 0) parts.push(`${remainingDays}j`);
    if (hours > 0) parts.push(`${hours}h`);
    if (mins > 0) parts.push(`${mins}min`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  }

  return parts.join(" ");
}

export function countGemAmountFromSeconds(seconds: number): number {
  const GEM_DURATION_SECONDS = 4 * 3600; // 4 heures
  return Math.floor(seconds / GEM_DURATION_SECONDS);
}

export const getPercentBeforeNextGem = (seconds: number): number => {
  const floor1 = 60 * 60 * 4; // 4h pour 1 gemme
  const floor2 = 60 * 60 * 8; // 8h pour 2 gemmes
  const floor3 = 60 * 60 * 12; // 12h pour 3 gemmes
  if (!seconds) return 0;
  if (seconds <= floor1) {
    return (seconds % floor1) / floor1;
  } else if (seconds <= floor2) {
    return (seconds % floor2) / floor2;
  } else if (seconds <= floor3) {
    return (seconds % floor3) / floor3;
  } else {
    return 0;
  }
};

export function getFutureDateFromDuration(
  date: Date,
  durationSeconds: number,
): Date {
  const futureTime = date.getTime() + durationSeconds * 1000; // convertir secondes en ms
  return new Date(futureTime);
}
