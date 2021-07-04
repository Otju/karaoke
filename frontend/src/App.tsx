import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import SongSelect from './components/SongSelect'
import KaraokePage from './components/KaraokePage'
import SongTweak from './components/SongTweak'
import { useState, useEffect, useRef } from 'react'
import SettingsPage from './components/SettingsPage'
import getAudioDevices from './utils/getAudioDevices'
import { IoSettingsSharp } from 'react-icons/io5'
import Modal from './components/Modal'
import Wad from './wad'
import useInterval from './hooks/useInterval'

const App = () => {
  const [allDevices, setAllDevices] = useState<MediaDeviceInfo[]>([])
  const [deviceIds, setDeviceIds] = useState<string[]>([...Array(4)].map(() => 'disabled'))
  const [settingsAreOpen, setSettingsAreOpen] = useState(false)
  const audioContextRef = useRef()
  const [, setVoice] = useState()
  const [tuner, setTuner] = useState()

  useEffect(() => {
    if (deviceIds) {
      var newVoice = new Wad({
        source: 'mic',
        deviceId: deviceIds[1],
      })
      var newTuner = new Wad.Poly()
      newTuner.setVolume(0)
      newTuner.add(newVoice)
      newVoice.play()
      newTuner.updatePitch()
      setVoice(newVoice)
      setTuner(newTuner)
    }
  }, [deviceIds])

  var logPitch = function () {
    if (tuner) {
      //@ts-ignore
      console.log(tuner.pitch, tuner.noteName)
    }
  }

  useInterval(logPitch, 1000)

  useEffect(() => {
    const audioContext = new AudioContext()
    //@ts-ignore
    audioContextRef.current = audioContext
  }, [])

  useEffect(() => {
    try {
      getAudioDevices({ setAllDevices, setDeviceIds })
    } catch (err) {
      console.error(err)
    }
  }, [setDeviceIds])

  return (
    <Router>
      <div className="App">
        <button className="bigButton settingsButton" onClick={() => setSettingsAreOpen(true)}>
          <IoSettingsSharp size={30} />{' '}
        </button>
        <Modal isVisible={settingsAreOpen} setInvisible={() => setSettingsAreOpen(false)}>
          <SettingsPage setDeviceIds={setDeviceIds} deviceIds={deviceIds} allDevices={allDevices} />
        </Modal>
        <Switch>
          <Route path="/song/:id">
            <KaraokePage
              deviceIds={deviceIds}
              audioContext={audioContextRef.current as unknown as AudioContext}
            />
          </Route>
          <Route path="/tweak/:id">
            <SongTweak />
          </Route>
          <Route path="/">
            <SongSelect />
          </Route>
        </Switch>
      </div>
    </Router>
  )
}

export default App
