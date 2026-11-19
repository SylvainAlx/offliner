import { useState } from "react";
import { useOnlineStatus } from "../stores/onlineStatusStore";
import { useUser } from "../stores/userStore";
import { PROJECTION_DURATIONS_MS } from "../utils/constants";
import { RESOURCE_TYPES } from "../models/resources";
import { getQueueEndOfflineMs, getVillageEvents } from "../models/timeline";

/**
 * "If you go offline for X hours from now": everything follows from the
 * current village and its queue, since the harvest and the queue only depend
 * on offline time.
 */
export function useVillageProjection() {
  const user = useUser((state) => state.user);
  const totalOfflineMs = useOnlineStatus((state) => state.totalOfflineMs);
  const [durationMs, setDurationMs] = useState(PROJECTION_DURATIONS_MS[1]);

  const from = totalOfflineMs;
  const to = from + durationMs;
  const before = user.getAvailableResources(from);
  const after = user.getAvailableResources(to);
  const gains = { ...after };
  for (const type of RESOURCE_TYPES) gains[type] = after[type] - before[type];

  const queueEnd = getQueueEndOfflineMs(user.village);
  // The queue stops on its own: time left without anything to build.
  const idleMs =
    queueEnd === null ? durationMs : Math.max(0, to - Math.max(from, queueEnd));

  return {
    durations: PROJECTION_DURATIONS_MS,
    durationMs,
    setDurationMs,
    originOfflineMs: from,
    gains,
    finalResources: after,
    ratesNow: user.getHarvestRates(from),
    ratesAfter: user.getHarvestRates(to),
    events: getVillageEvents(user.village, from, to),
    queueEndInMs: queueEnd === null ? null : Math.max(0, queueEnd - from),
    idleMs,
  };
}
