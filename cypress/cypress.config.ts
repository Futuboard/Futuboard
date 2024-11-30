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
                headless: HEADLESS
              }
            })

            await cluster.task(async ({ page, data }) => {
              try {
                const { url, index } = data

                await page.goto(url)

                await page.waitForSelector('input[name="password"]')
                await delay(500)
                await page.type('input[name="password"]', "alpha123")

                await page.waitForSelector('button[type="submit"]')
                await page.click('button[type="submit"]')

                await page.waitForSelector('button[aria-label="add column"]')

                await page.click('button[aria-label="add column"]')

                const columnTitle = `To Do (${index})`

                await page.type('input[name="columnTitle"]', columnTitle)
                await page.click('button[type="submit"]')

                await page.waitForSelector('button[aria-label="add task"]')
                await delay(500)
                await page.click('button[aria-label="add task"]')

                await page.waitForSelector('textarea[name="taskTitle"]')
                await page.type('textarea[name="taskTitle"]', `Card (${index})`)
                await page.type('input[name="size"]', String(index))
                await page.type('textarea[name="description"]', `Description (${index})`)
                await page.type('input[name="cornerNote"]', `Corner Note (${index})`)
                await page.click('button[type="submit"]')

                // Calling resolve() causes the Cypress test to continue.
                resolve(null)

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
