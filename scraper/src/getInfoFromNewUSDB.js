const puppeteer = require('puppeteer')
const fs = require('fs')
const cliProgress = require('cli-progress')

const getInfoForVideo = async (number, page) => {
  const url = `https://usdb.eu/s/s/${number}`
  await page.goto(url, { timeout: 0 })
  const data = await page.evaluate(() => {
    let videoId = null
    const getMatch = (string, regex) => {
      const match = string.match(regex)
      if (match) {
        return match[1]
      } else {
        return null
      }
    }
    document.querySelectorAll('iframe').forEach((item) => {
      const link = item.getAttribute('src')
      const possibleId = getMatch(
        link,
        /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i
      )
      if (possibleId) {
        videoId = possibleId
      }
    })
    let allValues = ''
    let artist = ''
    let title = ''
    document.querySelectorAll('.noLinkStyle > a').forEach((item, i) => {
      if (i === 1) {
        artist = item.textContent
      } else if (i === 2) {
        title = item.textContent
      }
    })
    document
      .querySelector('.grid.g2')
      .querySelectorAll('div')
      .forEach((item) => {
        allValues += item.textContent
      })
    const createdBy = getMatch(allValues, /CREATED BY (.+)BPM/i)
    const language = getMatch(allValues, /THIS SONG IS IN (.+)[.]/i)
    const gap = Number(getMatch(allValues, /GAP\D*(\d+[.,]?\d+)/i))
    const bpm = Number(getMatch(allValues, /BPM\D*(\d+[.,]?\d+)/i))
    return { videoId, createdBy, artist, title, gap, bpm, language }
  })
  return data
}

const main = async () => {
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  page.on('console', async (msg) => {
    const msgArgs = msg.args()
    for (let i = 0; i < msgArgs.length; ++i) {
      console.log(await msgArgs[i].jsonValue())
    }
  })
  const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
  const max = 2551
  const start = 1
  const filename = `newUSDB`
  bar.start(max, start - 1)
  const info = []
  for (let i = start; i <= max; i++)
    try {
      const newInfo = await getInfoForVideo(i, page)
      info.push(newInfo)
      if ((i + 1) % 100 === 0) {
        fs.writeFileSync(`./data/${filename}.json`, JSON.stringify(info))
      }
      bar.increment()
    } catch (e) {
      console.error(e)
    }
  fs.writeFileSync(`./data/${filename}.json`, JSON.stringify(info))
  bar.stop()
  console.log('Done!')
}
main()
