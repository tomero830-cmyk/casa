import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { applyTheme, getTheme } from '@/lib/theme'
import { registerServiceWorker } from '@/lib/push'

applyTheme(getTheme())
registerServiceWorker()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
