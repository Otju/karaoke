import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'

import SongSelect from './components/SongSelect'
import KaraokePage from './components/KaraokePage'
import SongTweak from './components/SongTweak'
import { useEffect, useState } from 'react'
import useMic from './hooks/useMic'

const App = () => {
  const [deviceIds, setDeviceIds] = useState<string[]>([])

  const { currentlySungNote: snowBallNote } = useMic({ deviceId: deviceIds[0] })
  const { currentlySungNote: headphoneNote } = useMic({ deviceId: deviceIds[1] })

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
          device.label.toLowerCase().includes('headset')
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
            <div>Snow {snowBallNote ? snowBallNote.key + snowBallNote.octave : '?'}</div>
            <div>Head {headphoneNote ? headphoneNote.key + headphoneNote.octave : '?'}</div>
            <button>RECORD</button>
            <SongSelect />
          </Route>
        </Switch>
      </div>
    </Router>
  )
}

export default App
