import Pitchfinder from 'pitchfinder'
import { noteNames } from './noteNames'

interface vars {
  sampleRate: number
  audioData: Float32Array
}

const analyseAudio = ({ sampleRate, audioData }: vars) => {
  const detectPitch = Pitchfinder.YIN({ sampleRate })
  const frequency = detectPitch(audioData)
  if (frequency === null) {
    return null
  }

  // Convert the frequency to a musical pitch.

  // c = 440.0(2^-4.75)
  const c0 = 440.0 * Math.pow(2.0, -4.75)
  // h = round(12log2(f / c))
  const halfStepsBelowMiddleC = Math.round(12.0 * Math.log2(frequency / c0))
  // o = floor(h / 12)
  const octave = Math.floor(halfStepsBelowMiddleC / 12.0)
  const key = noteNames[Math.floor(halfStepsBelowMiddleC % 12)]

  return { frequency, key, octave }
}

export default analyseAudio
