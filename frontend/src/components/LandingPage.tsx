import { Redirect } from 'react-router-dom'

const LandingPage = () => {
  return (
    <div>
      <p>Welcome to the karaoke site.</p>
      <Redirect to="/songs" />
      to: object
    </div>
  )
}

export default LandingPage
