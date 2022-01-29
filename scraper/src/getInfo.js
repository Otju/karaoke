const cheerio = require('cheerio')
const FormData = require('form-data')
const fetch = require('node-fetch')
const parseNotes = require('./parseNotes')
const fs = require('fs')
const cliProgress = require('cli-progress')
const getDiscogsInfo = require('./getDiscogsInfo')
const { performance } = require('perf_hooks')
const { title } = require('process')

const toBoolean = (string) => {
  if (string && typeof string === 'string' && string.toLowerCase === 'yes') {
    return true
  } else {
    return false
  }
}

const phpsessid = `PHPSESSID=${process.env.PHPSESSID}`

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
    if (!rawInfo) {
      console.error('No raw info')
      return null
    }
    const info = parseNotes(rawInfo)
    return info
  } catch (e) {
    console.error(e)
    return null
  }
}

const youtubeIdRegex =
  /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i

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
  let videoIdFromComments
  let gapFromComments
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
        let isVideoInThisComment = false
        const gapRegex = /GAP\D*(\d+[.,]?\d+)/i
        $(cell)
          .find('center > object > embed')
          .each((_, s) => {
            const rawId = $(s).attr('src')
            const match = rawId.match(youtubeIdRegex)
            const id = match && match[1]
            if (id) {
              isVideoInThisComment = true
              if (!videoIdFromComments) {
                videoIdFromComments = id
                const match = $(cell).text().match(gapRegex)
                if (match) {
                  gapFromComments = Number(match[1])
                }
              }
            }
          })
        const match = $(cell).text().match(gapRegex)
        if (match && !gapFromComments && !isVideoInThisComment) {
          gapFromComments = Number(match[1])
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
  return { additionalInfo: info, videoIdFromComments, gapFromComments }
}

const getVideoIdFromNewUSDB = ({ artist, title, createdBy, language }) => {
  const newUSDBData = JSON.parse(fs.readFileSync(`./newUSDBData.json`))
  let matches = newUSDBData.filter((info) => info.title === title && artist === info.artist)
  if (matches.length === 0) {
    return { videoIdFromNewUSDB: null, gapFromNewUSDB: null }
  }
  if (matches.length > 1) {
    const newMatches = newUSDBData.filter((info) => info.language === language)
    if (newMatches.length > 0) {
      matches = newMatches
    }
  }
  if (matches.length > 1) {
    const newMatches = newUSDBData.filter((info) => info.createdBy === createdBy)
    if (newMatches.length > 0) {
      matches = newMatches
    }
  }
  const { videoId, gap } = matches[0]
  return { videoIdFromNewUSDB: videoId, gapFromNewUSDB: gap }
}

const main = async () => {
  const infos = []
  const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
  let ids = JSON.parse(fs.readFileSync('./data/ids.json'))
  const oldSongs = JSON.parse(fs.readFileSync('./data/songs.json'))
  const start = oldSongs.length
  const count = 2000
  ids = ids.slice(start, start + count)
  bar.start(count, 0)
  for (const id of ids) {
    try {
      bar.increment()
      //const startTime = performance.now()
      let success = false
      const mainInfo = await getMainInfo(id)
      //const mainInfoTime = performance.now()
      if (!mainInfo) return
      const { additionalInfo, videoIdFromComments, gapFromComments } = await getAdditionalInfo(id)
      //const additionalInfoTime = performance.now()
      const { videoIdFromNewUSDB, gapFromNewUSDB } = getVideoIdFromNewUSDB({
        artist: mainInfo.artist,
        title: mainInfo.title,
        createdBy: additionalInfo.createdBy,
        language: mainInfo.language,
      })
      //const USDBtime = performance.now()
      let videoIdSource = 'discogs'
      const discogsInfo = await getDiscogsInfo({
        artist: mainInfo.artist,
        title: mainInfo.title,
      })
      //const discogsTime = performance.now()
      let { genres, year, videoUrls, ...otherDiscogsInfo } = discogsInfo
      if (!videoUrls) {
        videoUrls = []
      }
      if (videoIdFromComments) {
        if (gapFromComments) {
          mainInfo.gap = gapFromComments
        }
        videoUrls.unshift(videoIdFromComments)
        videoIdSource = 'comments'
      }
      if (videoIdFromNewUSDB && gapFromNewUSDB) {
        mainInfo.gap = gapFromNewUSDB
        videoUrls.unshift(videoIdFromNewUSDB)
        videoIdSource = 'newusdb'
      }
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
        videoId = videoUrls[0]
        if (videoUrls.length > 1) {
          videoUrls.shift()
          alternativeVideoIds = videoUrls
        }
      }
      const gapIsAutoGenerated = videoIdSource !== 'comments' && videoIdSource !== 'newusdb'
      const info = {
        ...mainInfo,
        ...additionalInfo,
        gapIsAutoGenerated,
        genres,
        year,
        videoId,
        alternativeVideoIds,
        ...otherDiscogsInfo,
        usdbId: id,
        videoIdSource,
      }
      infos.push(info)
      /*
      const fullTime = performance.now()
      const time1 = mainInfoTime - startTime
      const time2 = additionalInfoTime - mainInfoTime
      const time3 = USDBtime - additionalInfoTime
      const time4 = discogsTime - USDBtime
      const time5 = fullTime - startTime
      const timesToLog = {
        main: ' ' + (time1 / 1000.0).toFixed(1),
        additional: (time2 / 1000.0).toFixed(1),
        usdb: (time3 / 1000.0).toFixed(1),
        discogs: (time4 / 1000.0).toFixed(1),
        full: (time5 / 1000.0).toFixed(1),
      }
      console.log(timesToLog)
      */
    } catch (e) {
      console.error(e)
      infos.push({ id })
      console.log('FAILED', id)
    }
  }
  bar.stop()
  console.log('Writing to file...')
  fs.writeFileSync(`./data/backup/songs_${start}-${start + count}.json`, JSON.stringify(infos))
  fs.writeFileSync(`./data/songs.json`, JSON.stringify([...oldSongs, ...infos]))
  console.log('Done')
}

module.exports = main
