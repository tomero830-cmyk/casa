import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { applyPrefs } from '@/lib/prefs'
import { registerServiceWorker } from '@/lib/push'

applyPrefs()
registerServiceWorker()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
