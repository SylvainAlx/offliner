export type OfflinePeriod = {
  from: string; // ISO string
  to?: string; // undefined if ongoing
  duration?: number; // in seconds, undefined if ongoing
};
