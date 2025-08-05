// lib/getOrCreateDeviceId.ts
import { STORAGE_KEYS } from "@/constants/Labels";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuidv4 } from "uuid";

export async function getOrCreateDeviceId(): Promise<string> {
  const existingId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (existingId) return existingId;

  const newId = uuidv4();
  await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, newId);
  return newId;
}
