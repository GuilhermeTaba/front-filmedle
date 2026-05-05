import React from 'react'
import { useNavigate } from 'react-router-dom'
import './landingPage.css'
import axios from 'axios'

const apiUrl = import.meta.env.VITE_API_URL

const LandingPage = () => {
  const navigate = useNavigate()



  return (
    <div className="lp-root">

      <img src='/img/imagem_fundo_filmedle.jpg' className="lp-bg" />
      <div className="lp-overlay" />

      <div className="lp-corner-tl" />
      <div className="lp-corner-br" />

      <div className="lp-content">

        {/* Logo */}
        <div className="lp-logo-placeholder">
          <img src="/img/filmedle.png" alt="Logo" className="lp-logo-img" />
        </div>

        <div className="lp-divider" />

        {/* Botões */}
        <div className="lp-buttons">

          {/* Modo Infinito */}
          <button
            className="lp-btn lp-btn-primary"
            onClick={() => navigate('/infinito')}
          >
            <div className="lp-btn-icon">▶</div>
            <div className="lp-btn-body">
              <span className="lp-btn-title">Modo Infinito</span>
            </div>
            <div className="lp-btn-arrow">→</div>
          </button>

          {/* Modo Diário */}
          <button
            className="lp-btn lp-btn-secondary"
            onClick={() => navigate('/diario')}

          >
            <div className="lp-btn-icon">◈</div>
            <div className="lp-btn-body">
              <span className="lp-btn-title">Modo Diario</span>
            </div>
            <div className="lp-btn-arrow">→</div>
          </button>

        </div>
      </div>
    </div>
  )
}

export default LandingPage