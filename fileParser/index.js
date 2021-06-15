const fs = require('fs')

const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const parseFile = (fileName) => {
  const text = fs.readFileSync(`./textFiles/${fileName}.txt`).toString('utf-8')

  const textByLine = text.split('\n').map((item) => item.replace('\r', '').replace('\n', ''))

  const parseField = (fieldName) => {
    try {
      const foundLine = textByLine.find((item) => item.includes(fieldName.toUpperCase()))
      const value = foundLine.split(/:(.+)/)[1]
      return value
    } catch {
      return undefined
    }
  }
  const fields = ['artist', 'title', 'genre', 'edition', 'year', 'language', 'bpm', 'gap']

  const songInfo = {}

  fields.forEach((field) => {
    let value = parseField(field)
    if (value) {
      if (['bpm', 'gap', 'year'].includes(field)) {
        value = Number(value.replace(',', '.'))
      }
      songInfo[field] = value
    }
  })

  const notePages = []
  let currentNotes = []
  textByLine.map((text) => {
    if (/[:*F] \d+ \d+ \d+ .+/gm.test(text)) {
      const parts = text.split(' ')
      let type
      if (parts[0] === ':') {
        type = 'normal'
      } else if (parts[0] === '*') {
        type = 'golden'
      } else {
        type = 'free'
      }
      const beat = Number(parts[1])
      const length = Number(parts[2])
      const note = Number(parts[3])
      const noteToMax12 = note > 12 ? note - 12 : note
      const noteName = noteNames[noteToMax12 - 1]
      const lyric = parts.slice(4).join('')
      currentNotes.push({ type, beat, length, note, lyric, noteName })
    } else if (/- \d+/gm.test(text)) {
      const parts = text.split(' ')
      const beat = Number(parts[1])
      notePages.push({ startBeat: currentNotes[0].beat, endBeat: beat, notes: currentNotes })
      currentNotes = []
    }
    return null
  })

  songInfo.notePages = notePages

  //fs.writeFileSync(`./parsed/${fileName}.json`, JSON.stringify(songInfo))
  fs.writeFileSync(`../src/data/${fileName}.json`, JSON.stringify(songInfo))
}

parseFile('Mamma-Mia')
