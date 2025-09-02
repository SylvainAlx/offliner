export function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  seconds %= 86400;

  const years = Math.floor(days / 365);
  const remainingDays = days % 365;

  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  const parts: string[] = [];

  if (years > 0) parts.push(`${years}a`); // a = années
  if (remainingDays > 0) parts.push(`${remainingDays}j`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}min`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(" ");
}
