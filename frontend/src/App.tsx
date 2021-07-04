import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import SongSelect from './components/SongSelect'
import KaraokePage from './components/KaraokePage'
import SongTweak from './components/SongTweak'

const App = () => {
  return (
    <Router>
      <div className="App">
        <Switch>
          <Route path="/song/:id">
            <KaraokePage />
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
