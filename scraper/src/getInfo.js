const cheerio = require('cheerio')
const FormData = require('form-data')
const fetch = require('node-fetch')
const parseNotes = require('./parseNotes')
const fs = require('fs')
const cliProgress = require('cli-progress')
const getDiscogsInfo = require('./getDiscogsInfo')

const { saveSongToDB } = require('./saveToDB')

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
  const doneIds = JSON.parse(fs.readFileSync(`./data/doneIds.json`))
  const start = doneIds.length
  const count = 100
  ids = ids.slice(start, start + count)
  bar.start(count, 0)
  let succesfulCount = 0
  const newDoneIDs = []
  for (const id of ids) {
    try {
      bar.increment()
      let success = false
      const mainInfo = await getMainInfo(id)
      if (!mainInfo) return
      const additionalInfo = await getAdditionalInfo(id)
      const discogsInfo = await getDiscogsInfo({ artist: mainInfo.artist, title: mainInfo.title })
      let { genres, year, videoUrls, ...otherDiscogsInfo } = discogsInfo
      let videoId = ''
      let alternativeVideoIds = []
      const { genre } = mainInfo
      delete mainInfo.genre
      if (!genres) {
        genres = genre ? [genre] : []
      } else if (!genres.includes(genre)) {
        genres = genre ? [...genres, genre] : genres
      }
      if (mainInfo.year) {
        year = mainInfo.year
      }
      if (videoUrls && videoUrls.length !== 0) {
        const videoIDs = videoUrls
          .map((url) => {
            const idMatch = url.match(
              /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i
            )
            if (idMatch && idMatch[1]) {
              return idMatch[1]
            }
            return null
          })
          .filter((item) => item)
        videoId = videoIDs[0]
        if (videoIDs.length > 1) {
          videoIDs.shift()
          alternativeVideoIds = videoIDs
        }
      }
      if (!videoId) {
        const youtubeInfo = await getYoutubeVideoId(mainInfo.artist, mainInfo.title)
        videoId = youtubeInfo.videoId
        alternativeVideoIds = youtubeInfo.alternativeVideoIds
      }
      const info = {
        ...mainInfo,
        ...additionalInfo,
        gapIsAutoGenerated: true,
        genres,
        year,
        videoId,
        alternativeVideoIds,
        ...otherDiscogsInfo,
      }
      const hasVideo = Boolean(videoId)
      infos.push(info)
      const res = await saveSongToDB(info)
      if (res.errors) {
        console.log(res.errors)
      }
      if (res.data) {
        succesfulCount++
        success = true
      }
      newDoneIDs.push({ id, success, hasVideo })
    } catch (e) {
      console.error(e)
      newDoneIDs.push({ id, success: false, hasVideo: false })
    }
  }
  bar.stop()
  const d = new Date()
  const date = `${d.getDate()}-${d.getMonth()}-${d.getFullYear()}`
  console.log('Saved', succesfulCount, 'of', ids.length, 'songs to DB')
  console.log('Writing to file...')
  fs.writeFileSync(`./data/songs-${date}.json`, JSON.stringify(infos))
  console.log('Done')
  const combined = [...doneIds, ...newDoneIDs]
  fs.writeFileSync(`./data/doneIds.json`, JSON.stringify(combined))
}

module.exports = main
