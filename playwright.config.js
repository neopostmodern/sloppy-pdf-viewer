import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  testMatch: '*.spec.js',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:8081',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
      },
    },
  ],
  webServer: {
    command: 'npx http-server src/ -p 8081 -c-1 --silent',
    port: 8081,
    reuseExistingServer: !process.env.CI,
  },
});
