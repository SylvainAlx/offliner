import { getDeviceId, insertDevice } from "@/api/devices";
import { getReadableDeviceName } from "@/utils/deviceModelMap";
import { showMessage } from "@/utils/formatNotification";
import { Session } from "@supabase/supabase-js";

export const getAndUpdateLocalDevice = async (
  session: Session
): Promise<string> => {
  const deviceName = await getReadableDeviceName();

  if (deviceName) {
    try {
      const data = await getDeviceId(session, deviceName);
      if (!data) {
        console.warn(
          "L'appareil n'existe pas dans la base de données, insertion..."
        );
        await insertDevice(session, deviceName);
      }
    } catch (error) {
      if (error instanceof Error) {
        showMessage(error.message);
      }
    }
  }
  return deviceName ?? "Unknown Device";
};
