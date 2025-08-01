export const config = {
  startupDelayMs: Number(process.env.EXPO_PUBLIC_STARTUP_DELAY_MS) ?? 5000,
  minimumDurationMs:
    Number(process.env.EXPO_PUBLIC_MINIMUM_DURATION_MS) ?? 5000,
};
