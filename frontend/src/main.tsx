import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'
import { getTelegramWebApp } from './lib/telegram'
import './index.css'

getTelegramWebApp()?.ready()
getTelegramWebApp()?.expand()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
