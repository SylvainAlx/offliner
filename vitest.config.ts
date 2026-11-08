import { defineConfig } from 'vitest/config'

// Daily totals depend on the local time zone: tests run in a fixed zone that
// has daylight saving time, so day boundaries and DST changes are covered.
process.env.TZ = 'Europe/Paris'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    env: { TZ: 'Europe/Paris' },
    restoreMocks: true,
    unstubGlobals: true,
  },
})
