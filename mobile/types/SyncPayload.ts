import { OfflinePeriod } from "./OfflinePeriod";

export type SyncPayload = {
  deviceId: string;
  deviceName: string;
  username: string;
  offlinePeriods: OfflinePeriod[];
};
