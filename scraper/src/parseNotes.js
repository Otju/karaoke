const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const parseNotes = (text) => {
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
      const hasSpace = text.includes('  ')
      const parts = text.split(/\s+/gm)
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
      const isSecondOctave = Boolean(note > 12)
      const noteToMax12 = note >= 12 ? note - Math.floor(note / 12) * 12 : note
      const noteName = noteNames[noteToMax12]
      const lyric = (hasSpace ? ' ' : '') + parts[4]
      if (!noteName) {
        console.log({ type, beat, length, note, lyric, noteName, isSecondOctave })
      }
      currentNotes.push({ type, beat, length, note, lyric, noteName, isSecondOctave })
    } else if (/- \d+/gm.test(text)) {
      const parts = text.split(' ')
      const beat = Number(parts[1])
      const startBeat = currentNotes[0] ? currentNotes[0].beat : null
      if (currentNotes.length !== 0) {
        notePages.push({ startBeat, endBeat: beat, notes: currentNotes })
      }
      currentNotes = []
    }
    return null
  })

  songInfo.notePages = notePages
  return songInfo
}

module.exports = parseNotes
