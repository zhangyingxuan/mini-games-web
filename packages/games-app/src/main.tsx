import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.less'

const rootContainer = document.getElementById('root') || document.body

ReactDOM.createRoot(rootContainer).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
