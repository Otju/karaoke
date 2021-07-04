import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import SongSelect from './components/SongSelect'
import KaraokePage from './components/KaraokePage'
import SongTweak from './components/SongTweak'
import { useState, useEffect } from 'react'
import SettingsPage from './components/SettingsPage'
import getAudioDevices from './utils/getAudioDevices'
import { IoSettingsSharp } from 'react-icons/io5'
import Modal from './components/Modal'
import Wad from './wad'
import { Tuner } from './types/types'

const App = () => {
  const [allDevices, setAllDevices] = useState<MediaDeviceInfo[]>([])
  const [deviceIds, setDeviceIds] = useState<string[]>([
    '1522b6821da4fd92de7459aee17546c0dd46350e1bef6fdfd99d578781301ca8',
    'f724a192ea61b2527cf26ca7438b1e1887eb07b99bfcdd4d929f9b49993e0385',
    'f107e225cbe39be744cb6014917bdeefc74db062dcd6ef06b4e56370f0e02d95',
    'disabled',
  ]) //[...Array(4)].map(() => 'disabled')
  const [settingsAreOpen, setSettingsAreOpen] = useState(false)
  const [tuners, setTuners] = useState<Tuner[]>([])

  useEffect(() => {
    if (deviceIds) {
      deviceIds.forEach((deviceId, i) => {
        if (deviceId && deviceId !== 'disabled') {
          const voice = new Wad({
            source: 'mic',
            deviceId,
          })
          var newTuner = new Wad.Poly()
          newTuner.setVolume(0)
          newTuner.add(voice)
          voice.play()
          newTuner.updatePitch()
          setTuners((oldTuners) => {
            const newTuners = [...oldTuners]
            newTuners[i] = newTuner
            return newTuners
          })
        }
      })
    }
  }, [deviceIds])

  console.log(allDevices)

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
            <KaraokePage tuners={tuners} />
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
