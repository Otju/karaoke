import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import SongSelect from './components/SongSelect'
import KaraokePage from './components/KaraokePage'
import SongTweak from './components/SongTweak'
import { useState, useEffect } from 'react'
import SettingsPage from './components/SettingsPage'
import getAudioDevices from './utils/getAudioDevices'

const App = () => {
  const [allDevices, setAllDevices] = useState<MediaDeviceInfo[]>([])
  const [deviceIds, setDeviceIds] = useState<string[]>([...Array(4)].map(() => 'disabled'))

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
        <Switch>
          <Route path="/song/:id">
            <KaraokePage deviceIds={deviceIds} />
          </Route>
          <Route path="/tweak/:id">
            <SongTweak />
          </Route>
          <Route path="/settings">
            <SettingsPage
              setDeviceIds={setDeviceIds}
              deviceIds={deviceIds}
              allDevices={allDevices}
            />
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
