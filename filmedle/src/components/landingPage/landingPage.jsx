import React from 'react'
import './LandingPage.css'

const LandingPage = () => {
  return (
    <div className="lp-root">

      {/* ── Imagem de fundo ─────────────────────────────────────────────
          Substitua a <div> por <img> quando tiver a imagem:
          <img src="/sua-imagem.jpg" alt="" className="lp-bg" />
      ─────────────────────────────────────────────────────────────────── */}
      <img src='/img/imagem_fundo_filmedle.jpg' className="lp-bg" />
      <div className="lp-overlay" />

      <div className="lp-corner-tl" />
      <div className="lp-corner-br" />

      <div className="lp-content">

        {/* ── Logo ────────────────────────────────────────────────────── */}
        <div className="lp-logo-placeholder">
          <img src="/img/filmedle.png" alt="Logo" className="lp-logo-img" />
        </div>

        <div className="lp-divider" />

        {/* Botões verticais */}
        <div className="lp-buttons">

          <button className="lp-btn lp-btn-primary">
            <div className="lp-btn-icon">▶</div>
            <div className="lp-btn-body">
              <span className="lp-btn-title">Modo Infinito</span>

            </div>
            <div className="lp-btn-arrow">→</div>
          </button>

          <button className="lp-btn lp-btn-secondary">
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