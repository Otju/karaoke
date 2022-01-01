import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom'
import SongSelect from './components/SongSelect'
import KaraokePage from './components/KaraokePage'
import SongTweak from './components/SongTweak'
import LandingPage from './components/LandingPage'
import FavoritePage from './components/FavoritePage'

const App = () => {
  const header = (
    <div>
      <h1>Karaoke!</h1>
      <Link to="/songs" style={{ margin: 20 }}>
        Songs
      </Link>
      <Link to="/favorites" style={{ margin: 20 }}>
        Favorites
      </Link>
    </div>
  )

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
          <Route path="/songs">
            {header}
            <SongSelect />
          </Route>
          <Route path="/favorites">
            {header}
            <FavoritePage />
          </Route>
          <Route path="/">
            {header}
            <LandingPage />
          </Route>
        </Switch>
      </div>
    </Router>
  )
}

export default App
