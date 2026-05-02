import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './components/landingPage/landingPage'
import ModoDiario from './components/modoDiario/modoDiario'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={< LandingPage/>} />
        <Route path="/diario" element={< ModoDiario/>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
