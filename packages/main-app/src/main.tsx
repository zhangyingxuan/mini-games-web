import microApp from '@micro-zoe/micro-app'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.less'

microApp.start({
  shadowDOM: false,
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
