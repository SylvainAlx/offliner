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
