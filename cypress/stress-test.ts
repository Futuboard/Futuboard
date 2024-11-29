import { Cluster } from "puppeteer-cluster"

const args = process.argv.slice(2)

const [boardUrl, concurrentUsersString] = args

const concurrentUsers = Number(concurrentUsersString) || 1  

const main = async () => {


  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: concurrentUsers,
    /*puppeteerOptions: {
      headless: false,
    },
    */
  })

  await cluster.task(async ({ page, data }) => {
    try{
      const { url , index} = data
 
      await page.goto(url)
      await page.waitForSelector(".MuiTypography-root")

      await page.type('input[name="password"]', "alpha123");
      await page.click('button[type="submit"]');

      await page.waitForSelector('button[aria-label="add column"]')

      await page.click('button[aria-label="add column"]');

      await page.type('input[name="columnTitle"]', `To Do (${index})`);
      await page.click('button[type="submit"]');

    await delay(1000)
  } catch (e) {
    console.error(e)
  }
  })

  for (let i = 0; i < concurrentUsers; i++) {
    cluster.queue({url: boardUrl, index: i})
  }

  await cluster.idle()
  await cluster.close()
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

main()
