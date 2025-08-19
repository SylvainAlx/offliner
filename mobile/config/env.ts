export const config = {
  websiteUrl: process.env.EXPO_PUBLIC_WEBSITE_URL ?? "http://localhost:4321",
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
  geonamesUsername: process.env.EXPO_PUBLIC_GEONAMES_USERNAME ?? "",
  startupDelayMs: Number(process.env.EXPO_PUBLIC_STARTUP_DELAY_MS) ?? 5000,
  minimumDurationMs:
    Number(process.env.EXPO_PUBLIC_MINIMUM_DURATION_MS) ?? 5000,
};
