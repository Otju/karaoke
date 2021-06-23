const cheerio = require('cheerio')
const FormData = require('form-data')
const fetch = require('node-fetch')
const parseNotes = require('./parseNotes')
const fs = require('fs')
const cliProgress = require('cli-progress')

const saveSongToDB = require('./saveToDB')

const toBoolean = (string) => {
  if (string && typeof string === 'string' && string.toLowerCase === 'yes') {
    return true
  } else {
    return false
  }
}

const phpsessid = `PHPSESSID=${process.env.PHPSESSID}`

const getYoutubeVideoId = async (artist, title) => {
  try {
    const parameters = [
      ['key', process.env.YT_API_KEY],
      ['maxResults', 5],
      ['type', 'video'],
      ['videoEmbeddable', true],
      ['q', `${artist} ${title} official music video`],
    ]
    const parameterString = parameters
      .map(([key, value]) => {
        if (key === 'q') {
          value = value.replace(/\W+/g, '+')
        }
        return `${key}=${value}`
      })
      .join('&')
    const url = `https://www.googleapis.com/youtube/v3/search?${parameterString}`
    const res = await fetch(url)
    const data = await res.json()
    const videoIds = data.items.map((item) => item.id.videoId)
    const videoId = videoIds[0]
    videoIds.shift()
    const alternativeVideoIds = videoIds
    return { videoId, alternativeVideoIds }
  } catch (e) {
    console.error(e)
    return {}
  }
}

const getMainInfo = async (i) => {
  try {
    const txtUrl = `http://usdb.animux.de/index.php?link=gettxt&id=${i}`
    let formData = new FormData()
    formData.append('wd', 1)
    const res = await fetch(txtUrl, {
      body: formData,
      method: 'post',
      headers: {
        cookie: phpsessid,
      },
    })
    const page = await res.text()
    const $ = cheerio.load(page)
    const rawInfo = $('textarea[name=txt]').val()
    const info = parseNotes(rawInfo)
    return info
  } catch (e) {
    console.error(e)
    return null
  }
}

const getAdditionalInfo = async (i) => {
  const info = {}
  const infoUrl = `http://usdb.animux.de/index.php?link=detail&id=${i}`
  const res = await fetch(infoUrl, {
    headers: {
      cookie: phpsessid,
    },
  })
  const page = await res.text()
  const $ = cheerio.load(page)
  $('.list_tr2, .list_tr1').each((_, row) => {
    let key
    let value
    $(row)
      .find('td')
      .each((i, cell) => {
        const cellVal = $(cell).text()
        if (i === 0) {
          key = cellVal
        } else {
          value = cellVal
          if (key === 'Rating') {
            let rating = 0
            $(cell)
              .find('img')
              .each((_, star) => {
                const src = $(star).attr('src')
                if (src === 'images/half_star.png') {
                  rating += 0.5
                } else {
                  rating += 1
                }
              })
            info.rating = rating
          }
        }
      })
    switch (key) {
      case 'Golden Notes':
        info.goldenNotes = toBoolean(value)
        break
      case 'Created by':
        info.createdBy = value
        break
      case 'Views':
        info.views = Number(value)
        break
      case 'Rating':
        const match = value.match(/(\d+)/g)
        if (match[0]) {
          info.ratingCount = Number(match[0])
        } else {
          info.ratingCount = 0
        }
        break
      default:
        break
    }
  })
  return info
}

const main = async () => {
  const infos = []
  const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
  let ids = JSON.parse(fs.readFileSync('./data/ids.json'))
  const start = 0
  const count = 100
  ids = ids.slice(start, start + count)
  bar.start(count, 0)
  let succesfulCount = 0
  for (const id of ids) {
    bar.increment()
    const mainInfo = await getMainInfo(id)
    if (!mainInfo) return
    const additionalInfo = await getAdditionalInfo(id)
    const videoIdInfo = await getYoutubeVideoId(mainInfo.artist, mainInfo.title)
    const info = { ...mainInfo, ...additionalInfo, ...videoIdInfo }
    infos.push(info)
    const res = await saveSongToDB(info)
    if (res.errors) {
      console.log(res.errors)
    }
    if (res.data) {
      succesfulCount++
    }
  }
  bar.stop()
  console.log('Saved', succesfulCount, 'of', ids.length, 'songs to DB')
  console.log('Writing to file...')
  fs.writeFileSync(`./data/songs.json`, JSON.stringify(infos))
  console.log('Done')
}

module.exports = main