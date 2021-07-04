import Pitchfinder from 'pitchfinder'
import { CurrentlySungNote } from '../types/types'
import { noteNames } from './noteNames'

interface vars {
  sampleRate: number
  audioData: Float32Array
  tempo: number
}

const parseFrequency = (frequency: number | null) => {
  if (!frequency) return null
  const c0 = 440.0 * Math.pow(2.0, -4.75)
  const halfStepsBelowMiddleC = Math.round(12.0 * Math.log2(frequency / c0))
  const octave = Math.floor(halfStepsBelowMiddleC / 12.0)
  const key = noteNames[Math.floor(halfStepsBelowMiddleC % 12)]
  return { octave, frequency, key }
}

const analyseAudio = ({ sampleRate, audioData, tempo }: vars): CurrentlySungNote[] | null => {
  const detectPitch = Pitchfinder.AMDF({
    sampleRate,
    minFrequency: 300,
    maxFrequency: 3400,
    sensitivity: 0.5,
  })
  const frequencies = Pitchfinder.frequencies(detectPitch, audioData, { tempo, quantization: 4 })
  if (frequencies === null) {
    return null
  }

  const notes = frequencies
    .map((freq) => parseFrequency(freq))
    .filter((exist) => exist) as CurrentlySungNote[]
  return notes
}

export default analyseAudio
