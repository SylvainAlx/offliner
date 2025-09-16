import * as Device from "expo-device";

export async function getReadableDeviceName(): Promise<string> {
  const modelName = Device.modelName;
  if (modelName) {
    return modelName;
  } else {
    return "Smartphone inconnu";
  }
}

export async function getLocalDeviceId(): Promise<string> {
  return Device.modelId ?? "Smartphone inconnu";
}
