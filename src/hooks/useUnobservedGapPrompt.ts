import { useUser } from "../stores/userStore";
import { useOnlineStatus } from "../stores/onlineStatusStore";
import { UNOBSERVED_OFFLINE_CREDIT_CAP_MS } from "../utils/constants";

const HOUR_MS = 60 * 60 * 1000;

function formatSince(timestamp: number, now: number): string {
  const date = new Date(timestamp);
  const time = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  const sameDay = new Date(now).toDateString() === date.toDateString();
  if (sameDay) return `aujourd'hui à ${time}`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (yesterday.toDateString() === date.toDateString()) return `hier à ${time}`;

  const day = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
  return `le ${day} à ${time}`;
}

function formatLength(ms: number): string {
  const totalMinutes = Math.round(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${String(minutes).padStart(2, "0")}`;
}

export function useUnobservedGapPrompt() {
  const gaps = useUser((state) => state.user.periodList.unconfirmedGaps);
  const resolveUnconfirmedGaps = useUser((state) => state.resolveUnconfirmedGaps);
  const refreshFromUser = useOnlineStatus((state) => state.refreshFromUser);

  const isOpen = gaps.length > 0;
  const since = isOpen ? Math.min(...gaps.map((gap) => gap.start)) : 0;
  const totalMs = gaps.reduce((total, gap) => total + (gap.end - gap.start), 0);

  function answer(stayedOffline: boolean) {
    resolveUnconfirmedGaps(stayedOffline);
    refreshFromUser();
  }

  return {
    isOpen,
    sinceLabel: isOpen ? formatSince(since, Date.now()) : "",
    durationLabel: formatLength(totalMs),
    capLabel: `${UNOBSERVED_OFFLINE_CREDIT_CAP_MS / HOUR_MS} h`,
    isCapped: gaps.some((gap) => gap.end - gap.start > UNOBSERVED_OFFLINE_CREDIT_CAP_MS),
    answer,
  };
}
