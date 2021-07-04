const fetch = require('node-fetch')

const getDiscogsInfo = async ({ artist, title }) => {
  const search = `${artist.replace(/\W+/g, '+')}+${[title.replace(/\W+/g, '+')]}`
  const url = `https://api.discogs.com/database/search?q=${search}&token=PtCaieGjlFQptlBeXHsslugyccUwEPGQBByUtZTf&string=release&per_page=10`
  const res = await fetch(url)
  const data = await res.json()
  if (!data || !data.results) {
    return null
  }
  const firstItem = data.results[0]
  let {
    thumb: smallImage,
    cover_image: bigImage,
    resource_url,
    genre: genres,
    style: styles,
    year,
  } = firstItem
  year = year ? Number(year) : null
  const res2 = await fetch(resource_url)
  const rateLimitRemaining = res2.headers.get('x-discogs-ratelimit-remaining')
  if (rateLimitRemaining <= 1) {
    await new Promise((resolve) => setTimeout(resolve, 80 * 1000))
  }
  const data2 = await res2.json()
  const { videos } = data2
  const videoUrls = videos ? videos.map((item) => item.uri) : []
  return { smallImage, bigImage, genres, styles, year, videoUrls }
}

module.exports = getDiscogsInfo
