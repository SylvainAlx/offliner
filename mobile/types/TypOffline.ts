export type OfflinePeriod = { from: string; to?: string };

export type OfflineProgressContextType = {
  unsyncStats: UnsyncStats;
  setUnsyncStats: React.Dispatch<React.SetStateAction<UnsyncStats>>;
  isOnline: boolean;
  currentPeriodStart: string | null;
};

export type UnsyncStats = {
  total: number;
  weekly: number;
  daily: number;
};

export const emptyStats: UnsyncStats = {
  daily: 0,
  weekly: 0,
  total: 0,
};

export type DailySummary = {
  date: string;
  displayDate: string;
  totalSeconds: number;
};
