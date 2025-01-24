import { defineConfig } from "cypress"
import { Cluster } from "puppeteer-cluster"

// Can be set to false to see the browser for debugging purposes
const HEADLESS = true

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on("task", {
        "stress-test": async ({ boardUrl, concurrentUsers }: { boardUrl: string; concurrentUsers: number }) => {
          return new Promise(async (resolve, reject) => {
            const cluster = await Cluster.launch({
              concurrency: Cluster.CONCURRENCY_CONTEXT,
              maxConcurrency: concurrentUsers,
              puppeteerOptions: {
                headless: HEADLESS,
                args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1920,1080"],
                defaultViewport: null
              }
            })

            let doneCounter = 0

            await cluster.task(async ({ page, data }) => {
              try {
                const { url, index } = data

                await page.goto(url)

                await page.locator('input[name="password"]').fill("alpha123")
                await page.locator('button[type="submit"]').click()

                await page.locator('button[aria-label="add column"]').click()

                const columnTitle = `To Do (${index})`
                await page.locator('input[name="columnTitle"]').fill(columnTitle)

                await page.locator('button[type="submit"]').click()

                // Calling resolve() causes the Cypress test to continue. This is done when all dummy users have completed their tasks.
                doneCounter++
                if (doneCounter === concurrentUsers) {
                  resolve(null)
                }

                // Add delay, so browser keeps loading updates to board
                await delay(10_000)
              } catch (error) {
                // Calling reject() causes the Cypress test to fail.
                reject(error)

                await cluster.close()
              }
            })

            for (let i = 0; i < concurrentUsers; i++) {
              cluster.queue({ url: boardUrl, index: i })
            }

            // Wait for all tasks to complete
            await cluster.idle()

            await cluster.close()
          })
        }
      })
    },
    supportFile: "support/e2e.ts",
    specPattern: "e2e/**/*.cy.ts",
    experimentalMemoryManagement: true
  },

  defaultBrowser: "chrome",
  downloadsFolder: "downloads/",
  fixturesFolder: "fixtures/",
  screenshotsFolder: "screenshots/",
  videosFolder: "videos/",

  retries: process.env.RETRY_COUNT ? Number(process.env.RETRY_COUNT) : 0
})

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
