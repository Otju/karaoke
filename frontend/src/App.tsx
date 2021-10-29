import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import SongSelectPage from './components/SongSelectPage'
import KaraokePage from './components/KaraokePage'
import SongTweakPage from './components/SongTweakPage'

const App = () => {
  return (
    <Router>
      <div className="App">
        <Switch>
          <Route path="/song/:id">
            <KaraokePage />
          </Route>
          <Route path="/tweak/:id">
            <SongTweakPage />
          </Route>
          <Route path="/">
            <SongSelectPage />
          </Route>
        </Switch>
      </div>
    </Router>
  )
}

export default App
