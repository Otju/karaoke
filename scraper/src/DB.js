require('dotenv').config()
const fetch = require('node-fetch')
const { MongoClient } = require('mongodb')
const fs = require('fs')

const getDB = async () => {
  const client = new MongoClient(process.env.MONGODB_URL)
  await client.connect()
  const db = client.db('karaoke').collection('songs')
  return db
}

const getAllDataFromDB = async () => {
  const db = await getDB()
  const data = await db.find().toArray()
  fs.writeFileSync(`./data/ALLSONGS.json`, JSON.stringify(data))
  console.log('Done')
}

const saveSongsToDB = async (songs) => {
  const db = await getDB()
  const { acknowledged, insertedCount } = await db.insertMany(songs)
  console.log({ acknowledged, insertedCount })
}

const deleteDB = async () => {
  const db = await getDB()
  const res = await db.deleteMany({})
  console.log(res)
}

module.exports = { saveSongsToDB, deleteDB }
