import { Octave } from '../types/types'

const a4Freq = 440
const multiplier = 2 ** (1 / 12)
const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const calculateC = (number: number) => {
  const a4Freq = 440
  const power = 3 + number * 12
  const freq = a4Freq * multiplier ** power
  return freq
}

const calculateTwoOctaveNotes = (number: number) => {
  const notes = []
  const startCPower = 3 + number * 12
  for (let i = 0; i < 24; i++) {
    const power = startCPower + i
    const name = i >= 12 ? `${noteNames[i - 12]}2` : noteNames[i]
    const freq = a4Freq * multiplier ** power
    notes.push({ name, freq, number: i + 1 })
  }
  return notes
}

const getOctaves = () => {
  const octaves: Octave[] = []
  for (let i = -3; i <= 2; i++) {
    const min = calculateC(i)
    const max = calculateC(i + 1)
    const trueMax = calculateC(i + 2)
    const octave = i + 5
    const octaveNotes = calculateTwoOctaveNotes(i)
    octaves.push({ min, max, octave, trueMax, octaveNotes })
  }
  return octaves
}

export default getOctaves
