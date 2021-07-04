import analyzeAudio from '../utils/analyzeAudio'
import { useReactMediaRecorder } from 'react-media-recorder'
import { useState } from 'react'
import { NoteGroup } from '../types/types'

interface props {
  deviceId: string
  tempo: number
}

const audioContext = new AudioContext()

const useMic = ({ deviceId, tempo }: props) => {
  const isEnabled = Boolean(deviceId && deviceId !== 'disabled')

  const [sungNotes, setSungNotes] = useState<NoteGroup[]>([])

  const clearSungNotes = () => setSungNotes([])

  const { status, startRecording, mediaBlobUrl, stopRecording } = useReactMediaRecorder({
    audio: { deviceId },
  })

  const handleAudioProcessTick = () => {
    if (status === 'recording') {
      stopRecording()
    } else if (isEnabled) {
      startRecording()
      if (mediaBlobUrl) {
        processAudio(mediaBlobUrl)
      }
    }
  }

  const processAudio = async (url: string) => {
    try {
      const timestamp = new Date().getTime()
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      const audioData = audioBuffer.getChannelData(0)
      const newNotes = analyzeAudio({
        sampleRate: audioBuffer.sampleRate,
        audioData,
        tempo,
      })
      if (newNotes) {
        setSungNotes((notes) => [...notes, { notes: newNotes, timestamp }])
      }
    } catch {}
  }

  return { sungNotes, isEnabled, clearSungNotes, handleAudioProcessTick }
}

export default useMic
