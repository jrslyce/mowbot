import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  outputDir: "output/playwright",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4174",
    channel: "chrome",
    screenshot: "only-on-failure"
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
    { name: "mobile-landscape", use: { ...devices["iPhone 14"], browserName: "chromium", channel: "chrome", viewport: { width: 844, height: 390 }, isMobile: true } },
    { name: "mobile-portrait", use: { ...devices["iPhone 14"], browserName: "chromium", channel: "chrome", viewport: { width: 390, height: 844 }, isMobile: true } }
  ],
  webServer: { command: "node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4174 --strictPort", url: "http://127.0.0.1:4174", reuseExistingServer: true }
});
