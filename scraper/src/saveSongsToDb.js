const { saveSongsToDB, deleteDB } = require('./DB')
const fs = require('fs')

const save = async () => {
  const songs = JSON.parse(fs.readFileSync('./data/songs.json'))
  await deleteDB()
  await saveSongsToDB(songs)
}

save().then(() => console.log('DONE'))
