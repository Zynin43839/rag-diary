import { defineConfig, devices } from '@playwright/test'

/**
 * Smoke-level end-to-end checks.
 *
 * These are deliberately few and cheap: they prove the app still loads and that
 * the two things a user touches first (the sign-in form and the language switch)
 * still work. They are not a regression suite; Microfish covers exploration.
 *
 * Run: bun run test:e2e
 * Point them somewhere else with E2E_BASE_URL.
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'https://rag-diary-app.vercel.app',
    channel: 'chrome',
    locale: 'th-TH',
    timezoneId: 'Asia/Bangkok',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome' } }],
})
