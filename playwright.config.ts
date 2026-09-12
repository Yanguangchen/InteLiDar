import { defineConfig, devices } from '@playwright/test'

const reuse = !process.env.CI

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
    // The opening sweep is motion; pin the preference so the demo path is stable.
    reducedMotion: 'no-preference',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit-iphone', testMatch: '**/capture.spec.ts', use: { ...devices['iPhone 13 Pro'] } },
  ],
  webServer: [
    {
      command: 'npm run backend',
      url: 'http://127.0.0.1:8000/health',
      reuseExistingServer: reuse,
      timeout: 30_000,
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5173',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: reuse,
      timeout: 30_000,
    },
  ],
})
