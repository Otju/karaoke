import analyzeAudio from '../utils/analyzeAudio'
import { useReactMediaRecorder } from 'react-media-recorder'
import useInterval from './useInterval'
import { useState, useEffect } from 'react'

interface CurrentlySungNote {
  frequency: number
  key: string
  octave: number
}

interface props {
  deviceId: string
}

const audioContext = new AudioContext()

const useMic = ({ deviceId }: props) => {
  const [currentlySungNote, setCurrentlySungNote] = useState<CurrentlySungNote | null>()

  const { status, startRecording, mediaBlobUrl, stopRecording } = useReactMediaRecorder({
    audio: { deviceId },
  })

  const process = async (url: string) => {
    // Load the blob.
    const response = await fetch(url)
    const arrayBuffer = await response.arrayBuffer()
    // Decode the audio.
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    const audioData = audioBuffer.getChannelData(0)
    // Send the audio data to the audio processing worker.
    const note = analyzeAudio({
      sampleRate: audioBuffer.sampleRate,
      audioData,
    })
    setCurrentlySungNote(note)
  }

  const handleStop = () => {
    if (status === 'recording') {
      stopRecording()
    }
  }

  const handleStart = () => {
    startRecording()
  }

  useEffect(() => {
    if (mediaBlobUrl) {
      process(mediaBlobUrl)
    }
  }, [mediaBlobUrl])

  useInterval(() => {
    if (status === 'recording') {
      handleStop()
    } else {
      handleStart()
    }
  }, 250)

  return { currentlySungNote }
}

export default useMic
