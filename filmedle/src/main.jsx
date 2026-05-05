import { StrictMode } from 'react'

import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './components/landingPage/landingPage.jsx'
import ModoDiario from './components/modoDiario/modoDiario.jsx'
import ModoInfinito from './components/modoInfinito/modoInfinito.jsx'
import './index.css'  

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={< LandingPage/>} />
        <Route path="/diario" element={< ModoDiario/>} />
         <Route path="/infinito" element={< ModoInfinito/>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
