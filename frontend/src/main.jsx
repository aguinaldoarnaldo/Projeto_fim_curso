import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { CacheProvider } from './context/CacheContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <CacheProvider>
          <App />
        </CacheProvider>
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>
)
