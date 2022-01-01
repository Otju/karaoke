import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'
import { createClient, Provider } from 'urql'

const client = createClient({
  url: process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000/dev/graphql',
})

ReactDOM.render(
  <React.StrictMode>
    <Provider value={client}>
      <App />
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
)
