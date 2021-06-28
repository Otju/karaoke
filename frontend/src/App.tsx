import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'

import SongSelect from './components/SongSelect'
import KaraokePage from './components/KaraokePage'
import SongTweak from './components/SongTweak'
import { useEffect } from 'react'
import analyzeAudio from './utils/analyzeAudio'
import { useReactMediaRecorder } from 'react-media-recorder'
import { useState } from 'react'

const audioContext = new AudioContext()
const App = () => {
  const [deviceIds, setDeviceIds] = useState<string[]>([])
  console.log({ deviceId: deviceIds[0] })

  const { status, startRecording, mediaBlobUrl, stopRecording } = useReactMediaRecorder({
    audio: true,
  })

  const process = async (url: string) => {
    // Load the blob.
    const response = await fetch(url)
    const arrayBuffer = await response.arrayBuffer()
    // Decode the audio.
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    const audioData = audioBuffer.getChannelData(0)
    // Send the audio data to the audio processing worker.
    const res = analyzeAudio({
      sampleRate: audioBuffer.sampleRate,
      audioData,
    })
    console.log(res)
    return res
  }

  const handleStop = () => {
    if (status === 'recording') {
      stopRecording()
    }
    console.log('4', status)
    console.log('MEDIA', mediaBlobUrl)
    if (mediaBlobUrl) {
      console.log(process(mediaBlobUrl))
    }
  }

  /*
  const listen = () => {
    startRecording()
    console.log('1', status)
    setTimeout(() => handleStop(), 500)
    console.log('2', status)
    // Every 500ms, send whatever has been recorded to the audio processor.
    // This can't be done with `mediaRecorder.start(ms)` because the
    // `AudioContext` may fail to decode the audio data when sent in parts.
    setInterval(() => {
      startRecording()
      console.log('3', status)
      setTimeout(() => handleStop(), 500)
    }, 1000)
  }
  */

  console.log(status)

  useEffect(() => {
    async function getMedia() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        devices.filter(
          (device) =>
            device.kind === 'audioinput' &&
            device.deviceId !== 'communications' &&
            device.deviceId !== 'default'
        )
        const idOne = devices.find((device) =>
          device.label.toLowerCase().includes('snowball')
        )?.deviceId
        const idTwo = devices.find((device) =>
          device.label.toLowerCase().includes('array')
        )?.deviceId
        if (idOne && idTwo) {
          setDeviceIds([idOne, idTwo])
        }
      } catch (err) {
        console.error(err)
      }
    }
    getMedia()
  }, [])

  console.log(mediaBlobUrl)

  return (
    <Router>
      <div className="App">
        <Switch>
          <Route path="/song/:id">
            <KaraokePage voice={null} tuner={null} />
          </Route>
          <Route path="/tweak/:id">
            <SongTweak />
          </Route>
          <Route path="/">
            <button onClick={startRecording}>RECORD</button>
            <button onClick={handleStop}>RECORD</button>
            <SongSelect />
          </Route>
        </Switch>
      </div>
    </Router>
  )
}

export default App
