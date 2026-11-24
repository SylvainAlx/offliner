function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function formatDateTime(ts: number): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

function formatDay(ts: number): string {
  const value = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(ts));
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatMonth(ts: number): string {
  const value = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(new Date(ts));
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** "aujourd'hui", "hier", "il y a 3 jours": calendar days, local time. */
function formatDaysAgo(ts: number, now: number): string {
  const startOfDay = (value: number) => {
    const date = new Date(value);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  };
  const days = Math.round((startOfDay(now) - startOfDay(ts)) / (24 * 60 * 60 * 1000));
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return "hier";
  return `il y a ${days} jours`;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (hours === 0) parts.push(`${seconds}s`);
  else if (seconds > 0) parts.push(`${seconds}s`);

  if (parts.length === 0) return "0s";
  return parts.join(" ");
}

export const formatCountdown = (milliseconds: number): string => {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mmss = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    : mmss;
};

/** A rounded length of time, such as "35 min" or "2 h 05". */
function formatLength(ms: number): string {
  const totalMinutes = Math.round(ms / 60_000);
  if (totalMinutes < 1) return "moins d'une minute";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${String(minutes).padStart(2, "0")}`;
}

/** A wait counted in days, such as "3 j 04 h", or in hours below a day. */
function formatWait(ms: number): string {
  const totalHours = Math.floor(Math.max(0, ms) / 3_600_000);
  if (totalHours < 24) return formatLength(ms);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return hours === 0 ? `${days} j` : `${days} j ${String(hours).padStart(2, "0")} h`;
}

export {
  formatWait,
  formatLength,
  formatDate,
  formatDateTime,
  formatDay,
  formatMonth,
  formatDuration,
  formatDaysAgo,
};
