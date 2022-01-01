import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom'
import SongSelectPage from './components/SongSelectPage'
import KaraokePage from './components/KaraokePage'
import SongTweakPage from './components/SongTweakPage'
import LandingPage from './components/LandingPage'
import FavoritePage from './components/FavoritePage'

const App = () => {
  const header = (
    <div style={{ marginBottom: 20 }}>
      <h1 style={{ marginTop: 0 }}>Karaoke!</h1>
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
            <SongSelectPage />
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
