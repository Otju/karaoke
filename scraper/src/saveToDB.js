const fs = require('fs')
const fetch = require('node-fetch')
const util = require('util')

const saveSongToDB = async (song) => {
  try {
    const url = `http://localhost:4000/graphql`
    let fieldString = JSON.stringify(song)
    fieldString = fieldString.replace(/"([^"]+)":/g, '$1:')
    const query = `
    mutation {
      createSong(songData: ${fieldString}) {
        _id
        artist
      } 
    }
   `
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query }),
    })
    const data = await res.json()
    return data
  } catch (e) {
    console.error(e)
    return {}
  }
}

const saveAllSongsToDB = async () => {
  const songs = JSON.parse(fs.readFileSync('../data/songs.json'))
  let succesfulCount = 0
  for (const song of songs) {
    const res = await saveSongToDB(song)
    if (res.data) {
      succesfulCount++
    }
  }
  console.log('Saved', succesfulCount, 'of', songs.length, 'songs to DB')
}

module.exports = saveSongToDB
