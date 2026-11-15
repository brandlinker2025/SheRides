import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:3456",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3456",
    url: "http://127.0.0.1:3456",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
