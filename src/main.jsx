import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { PopulationProvider } from './context/PopulationContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PopulationProvider>
      <App />
    </PopulationProvider>
  </StrictMode>,
)
