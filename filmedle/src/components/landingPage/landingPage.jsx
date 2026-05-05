import React from 'react'
import { useNavigate } from 'react-router-dom'
import './landingPage.css'
import CinemaBackground from "../cinemaBackground/cinemaBackground.jsx";

const LandingPage = () => {
  const navigate = useNavigate()

  return (
    <div className="lp-root">

      <CinemaBackground />

      <div className="lp-content">

        {/* Logo CSS */}
        <div className="lp-logo-wrap">
          <div className="lp-logo">
            <span className="lp-logo-play">▶</span>
            <span className="lp-logo-text">FILMEDLE</span>
          </div>
        </div>

        {/* Botões de modo */}
        <div className="lp-buttons">
          <button className="lp-btn lp-btn-primary" onClick={() => navigate('/diario')}>
            <span className="lp-btn-icon">◈</span>
            <span className="lp-btn-body">
              <span className="lp-btn-title">Modo Diário</span>
              <span className="lp-btn-desc">Um desafio novo a cada dia, para todos</span>
            </span>
            <span className="lp-btn-arrow">→</span>
          </button>

          <button className="lp-btn lp-btn-secondary" onClick={() => navigate('/infinito')}>
            <span className="lp-btn-icon">▶</span>
            <span className="lp-btn-body">
              <span className="lp-btn-title">Modo Infinito</span>
              <span className="lp-btn-desc">Sem limite — adivinhe quantos filmes quiser</span>
            </span>
            <span className="lp-btn-arrow">→</span>
          </button>
        </div>

        <p className="lp-hint">Selecione um modo para começar</p>

      </div>

    </div>
  )
}

export default LandingPage
