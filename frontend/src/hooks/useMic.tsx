import analyzeAudio from '../utils/analyzeAudio'
import { useReactMediaRecorder } from 'react-media-recorder'
import useInterval from './useInterval'
import { useState, useEffect } from 'react'
import { CurrentlySungNote } from '../types/types'

interface props {
  deviceId: string
}

const audioContext = new AudioContext()

const useMic = ({ deviceId }: props) => {
  const isEnabled = Boolean(deviceId && deviceId !== 'disabled')

  const [currentlySungNote, setCurrentlySungNote] = useState<CurrentlySungNote | null>(null)

  const { status, startRecording, mediaBlobUrl, stopRecording } = useReactMediaRecorder({
    audio: { deviceId },
  })

  const calcInterval = 100

  useEffect(() => {
    if (mediaBlobUrl) {
      process(mediaBlobUrl)
    }
  }, [mediaBlobUrl])

  useInterval(() => {
    if (status === 'recording') {
      handleStop()
    } else if (isEnabled) {
      handleStart()
    }
  }, calcInterval)

  const process = async (url: string) => {
    try {
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      const audioData = audioBuffer.getChannelData(0)
      // Send the audio data to the audio processing worker.
      const note = analyzeAudio({
        sampleRate: audioBuffer.sampleRate,
        audioData,
      })
      if (note) {
        setCurrentlySungNote(note)
      }
    } catch {}
  }

  const handleStop = () => {
    if (status === 'recording') {
      stopRecording()
    }
  }

  const handleStart = () => {
    startRecording()
  }

  return { currentlySungNote, isEnabled }
}

export default useMic
