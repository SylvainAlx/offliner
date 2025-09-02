import { supabase } from "src/lib/supabase";

export async function getLatestDeviceNameByUserId(
  userId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("devices")
    .select("name")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Erreur Supabase :", error);
    return "";
  }

  return data?.[0]?.name ?? "";
}
