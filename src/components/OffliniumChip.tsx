import { useState } from "react";
import { useOnlineStatus } from "../stores/onlineStatusStore";
import { useUser } from "../stores/userStore";
import { formatAmount, RESOURCE_LABELS } from "../models/resources";
import { NIGHT_CREDIT_CAP_MS, OFFLINIUM_PER_HOUR } from "../utils/constants";

/**
 * How the Offlinium counter looks:
 * - online: a plain chip;
 * - pending: offline, waiting for the period to be confirmed;
 * - producing: Offlinium is flowing in (spinning crystal, pulse, gains);
 * - night: offline, but tonight's credit is used up.
 */
export type OffliniumState = "online" | "pending" | "producing" | "night";

const chipClass =
  "relative inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-(--mono) text-[0.8rem] transition-[background-color,border-color,color] duration-300";

const STATE_CLASS: Record<OffliniumState, string> = {
  online: "border-(--gray-200) bg-white text-(--gray-900) shadow-(--shadow-sm)",
  pending:
    "border-dashed border-(--accent-border) bg-(--accent-bg) text-(--gray-900)",
  producing:
    "offlinium-producing border-transparent bg-(--accent-solid) text-(--on-color) font-bold",
  night: "border-(--accent-border) bg-(--accent-bg) text-(--gray-900)",
};

/** The Offlinium crystal, drawn so it can turn around its center. */
function OffliniumIcon({ state }: { state: OffliniumState }) {
  const spin =
    state === "producing"
      ? "offlinium-spin"
      : state === "pending"
        ? "offlinium-spin offlinium-spin-slow"
        : "";
  return (
    <svg
      className={`size-[1.05em] shrink-0 ${spin}`}
      viewBox="-12 -12 24 24"
      aria-hidden="true"
    >
      <polygon
        points="0,-10.5 9.1,-5.25 9.1,5.25 0,10.5 -9.1,5.25 -9.1,-5.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <polygon
        points="0,-4.5 3.9,-2.25 3.9,2.25 0,4.5 -3.9,2.25 -3.9,-2.25"
        fill="currentColor"
        opacity={state === "online" ? 0 : 0.9}
      />
    </svg>
  );
}

/** The player's Offlinium, brought to life while the device is offline. */
export default function OffliniumChip() {
  const isOnline = useOnlineStatus((state) => state.isOnline);
  const isPending = useOnlineStatus((state) => state.offlineCountdownMs !== null);
  const lastChecked = useOnlineStatus((state) => state.lastChecked);
  const offlinium = useUser((state) => state.user.offlinium);
  const multiplier = useUser((state) => state.user.offliniumMultiplier);
  const periodList = useUser((state) => state.user.periodList);

  const nightUsedMs =
    isOnline || !lastChecked ? null : periodList.getNightCreditUsedMs(lastChecked.getTime());
  const state: OffliniumState = isOnline
    ? "online"
    : isPending
      ? "pending"
      : nightUsedMs !== null && nightUsedMs >= NIGHT_CREDIT_CAP_MS
        ? "night"
        : "producing";

  // Each delivery rises from the chip. The previous amount is kept in state
  // (and not in a ref) so the gain is found while rendering.
  const amount = Math.floor(offlinium);
  const [previous, setPrevious] = useState(amount);
  const [gain, setGain] = useState<{ id: number; value: number } | null>(null);
  if (state !== "producing" && gain !== null) setGain(null);
  if (amount !== previous) {
    setPrevious(amount);
    if (amount > previous && state === "producing") {
      setGain({ id: (gain?.id ?? 0) + 1, value: amount - previous });
    }
  }

  const perHour = formatAmount(OFFLINIUM_PER_HOUR * multiplier);
  const label = RESOURCE_LABELS.offlinium;
  const title = {
    online: `${label} : produit uniquement hors ligne`,
    pending: `${label} : hors ligne, la production va démarrer`,
    producing: `${label} : production en cours, +${perHour} par heure`,
    night: `${label} : le temps de cette nuit est compté, la production reprendra au matin`,
  }[state];

  return (
    <span
      className={`${chipClass} ${STATE_CLASS[state]}`}
      title={title}
      aria-label={`${formatAmount(offlinium)} ${label}${
        state === "producing" ? `, production en cours : +${perHour} par heure` : ""
      }`}
    >
      <OffliniumIcon state={state} />
      {formatAmount(offlinium)}
      {state === "producing" && (
        <span className="text-[0.7rem] font-semibold opacity-80" aria-hidden="true">
          +{perHour}/h
        </span>
      )}
      {state === "night" && <span aria-hidden="true">🌙</span>}
      {gain && state === "producing" && (
        <span
          key={gain.id}
          className="offlinium-gain pointer-events-none absolute -top-1 right-2 text-[0.72rem] font-extrabold text-(--accent)"
          aria-hidden="true"
        >
          +{formatAmount(gain.value)}
        </span>
      )}
    </span>
  );
}
