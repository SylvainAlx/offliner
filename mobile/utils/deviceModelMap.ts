import * as Device from "expo-device";

// Mapping utile uniquement pour Apple (iPhone/iPad)
const deviceModelMap: Record<string, string> = {
  // iPhone
  "iPhone10,3": "iPhone X",
  "iPhone10,6": "iPhone X",
  "iPhone11,2": "iPhone XS",
  "iPhone11,4": "iPhone XS Max",
  "iPhone11,6": "iPhone XS Max",
  "iPhone11,8": "iPhone XR",
  "iPhone12,1": "iPhone 11",
  "iPhone12,3": "iPhone 11 Pro",
  "iPhone12,5": "iPhone 11 Pro Max",
  "iPhone13,1": "iPhone 12 mini",
  "iPhone13,2": "iPhone 12",
  "iPhone13,3": "iPhone 12 Pro",
  "iPhone13,4": "iPhone 12 Pro Max",
  "iPhone14,4": "iPhone 13 mini",
  "iPhone14,5": "iPhone 13",
  "iPhone14,2": "iPhone 13 Pro",
  "iPhone14,3": "iPhone 13 Pro Max",
  "iPhone14,6": "iPhone SE (3rd gen)",
  "iPhone15,2": "iPhone 14 Pro",
  "iPhone15,3": "iPhone 14 Pro Max",
  "iPhone15,4": "iPhone 14",
  "iPhone15,5": "iPhone 14 Plus",
  "iPhone16,1": "iPhone 15 Pro",
  "iPhone16,2": "iPhone 15 Pro Max",
  "iPhone16,3": "iPhone 15",
  "iPhone16,4": "iPhone 15 Plus",

  // iPad
  "iPad7,11": "iPad 7th Gen (10.2-inch)",
  "iPad7,12": "iPad 7th Gen (10.2-inch)",
  "iPad11,6": "iPad 8th Gen (10.2-inch)",
  "iPad11,7": "iPad 8th Gen (10.2-inch)",
  "iPad12,1": "iPad 9th Gen",
  "iPad12,2": "iPad 9th Gen",
  "iPad13,18": "iPad 10th Gen",
  "iPad13,19": "iPad 10th Gen",

  // iPad Pro
  "iPad8,1": "iPad Pro 11-inch (1st Gen)",
  "iPad8,2": "iPad Pro 11-inch (1st Gen)",
  "iPad8,3": "iPad Pro 11-inch (1st Gen)",
  "iPad8,4": "iPad Pro 11-inch (1st Gen)",
  "iPad8,5": "iPad Pro 12.9-inch (3rd Gen)",
  "iPad8,6": "iPad Pro 12.9-inch (3rd Gen)",
  "iPad8,7": "iPad Pro 12.9-inch (3rd Gen)",
  "iPad8,8": "iPad Pro 12.9-inch (3rd Gen)",
  "iPad13,4": "iPad Pro 11-inch (3rd Gen)",
  "iPad13,5": "iPad Pro 11-inch (3rd Gen)",
  "iPad13,6": "iPad Pro 11-inch (3rd Gen)",
  "iPad13,7": "iPad Pro 11-inch (3rd Gen)",
  "iPad13,8": "iPad Pro 12.9-inch (5th Gen)",
  "iPad13,9": "iPad Pro 12.9-inch (5th Gen)",
  "iPad13,10": "iPad Pro 12.9-inch (5th Gen)",
  "iPad13,11": "iPad Pro 12.9-inch (5th Gen)",
};

export async function getReadableDeviceName(): Promise<string> {
  const modelId = Device.modelId;
  const modelName = Device.modelName;

  // iOS uniquement (sinon c’est null)
  if (modelId && deviceModelMap[modelId]) {
    return deviceModelMap[modelId];
  }

  // Android → modelName est déjà lisible
  if (modelName) {
    if (modelName === "sdk_gphone64_x86_64") {
      return "Émulateur Android";
    }
    return modelName;
  }

  return "Unknown Device";
}

export async function getLocalDeviceId(): Promise<string> {
  return Device.modelId ?? "Unknown Device";
}
