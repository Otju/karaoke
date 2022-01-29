const fetch = require('node-fetch')

const getMatch = (string, regex) => {
  const match = string.match(regex)
  if (match) {
    return match[1]
  } else {
    return null
  }
}

const getDiscogsInfo = async ({ artist, title }) => {
  const search = `${artist.replace(/\W+/g, '+')}+${[title.replace(/\W+/g, '+')]}`
  const url = `https://api.discogs.com/database/search?q=${search}&key=${process.env.DISCOGS_KEY}&secret=${process.env.DISCOGS_SECRET}&string=release&per_page=10`
  const res = await fetch(url)
  const data = await res.json()
  if (!data || !data.results) {
    return null
  }
  const firstItem = data.results[0]
  if (!firstItem) {
    return null
  }
  let {
    thumb: smallImage,
    cover_image: bigImage,
    resource_url,
    genre: genres,
    style: styles,
    year,
  } = firstItem
  year = year ? Number(year) : null
  const url2 = `${resource_url}?&key=${process.env.DISCOGS_KEY}&secret=${process.env.DISCOGS_SECRET}`
  const res2 = await fetch(url2)
  const rateLimitRemaining = res2.headers.get('x-discogs-ratelimit-remaining')
  if (rateLimitRemaining <= 1) {
    await new Promise((resolve) => setTimeout(resolve, 10 * 1000))
  }
  const data2 = await res2.json()
  const { videos } = data2
  const videoUrls = videos
    ? videos.map((item) =>
        getMatch(
          item.uri,
          /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i
        )
      )
    : []
  return { smallImage, bigImage, genres, styles, year, videoUrls }
}

module.exports = getDiscogsInfo
