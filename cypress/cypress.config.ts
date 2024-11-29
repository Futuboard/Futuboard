import { defineConfig } from "cypress"

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    supportFile: "support/e2e.ts",
    specPattern: "e2e/**/*.cy.ts"
  },

  defaultBrowser: "chrome",
  downloadsFolder: "downloads/",
  fixturesFolder: "fixtures/",
  screenshotsFolder: "screenshots/",
  videosFolder: "videos/",

  retries: process.env.RETRY_COUNT ? Number(process.env.RETRY_COUNT) : 0
})
