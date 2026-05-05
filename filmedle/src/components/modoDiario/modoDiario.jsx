import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './modoDiario.css'
import CinemaBackground from "../cinemaBackground/CinemaBackground.jsx";

const BASE_URL = '/api'
// ─────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────

async function buscarFilmes() {
  const res = await fetch(`${BASE_URL}/filme/filtro`)
  if (!res.ok) throw new Error(`Erro ao buscar filmes: ${res.status}`)
  const data = await res.json()
  const lista = Array.isArray(data) ? data : data?.content ?? data?.items ?? data?.filmes ?? data?.data ?? []
  return lista.map(f => ({ id: f.id, nome: f.nome ?? f.title ?? f.titulo ?? '' })).filter(f => f.id && f.nome)
}

async function iniciarPartida() {
  const res = await fetch(`${BASE_URL}/partida/inicia?modo=diario`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`Erro ao iniciar partida: ${res.status}`)
  return res.json()
}

async function enviarChute(partidaId, chuteId) {
  const res = await fetch(`${BASE_URL}/partida/${partidaId}/chute/${chuteId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`Erro ao enviar chute: ${res.status}`)
  const text = await res.text()
  if (!text) return null
  return JSON.parse(text)
}

async function buscarDica(partidaId) {
  const res = await fetch(`${BASE_URL}/partida/${partidaId}/dica`)
  if (!res.ok) throw new Error(`Erro ao buscar dica: ${res.status}`)
  return res.json()
}

async function desistir(partidaId) {
  const res = await fetch(`${BASE_URL}/partida/${partidaId}/desistir`)
  if (!res.ok) throw new Error(`Erro ao desistir: ${res.status}`)
  return res.json()
}

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

function statusToClass(status) {
  switch (String(status ?? '').toUpperCase()) {
    case 'CORRETO':    return 'correct'
    case 'PARCIAL':    return 'partial'
    case 'SETA_CIMA':  return 'partial'
    case 'SETA_BAIXO': return 'partial'
    default:           return 'wrong'
  }
}

function seta(status) {
  switch (String(status ?? '').toUpperCase()) {
    case 'SETA_CIMA':  return ' ↑'
    case 'SETA_BAIXO': return ' ↓'
    default:           return ''
  }
}

function fmt(value) {
  if (Array.isArray(value))
    return value.map(v => (typeof v === 'object' ? v.nome ?? '' : String(v))).filter(Boolean).join(', ')
  if (value == null) return ''
  return String(value)
}

function fmtReceita(value) {
  const n = Number(value)
  if (!value || isNaN(n)) return fmt(value)
  return new Intl.NumberFormat('pt-BR').format(n)
}

function palpiteAcertou(p) {
  return ['diretor', 'elenco', 'genero', 'lancamento', 'pais', 'produtora', 'receita']
    .every(c => String(p[c] ?? '').toUpperCase() === 'CORRETO')
}

function normalizeText(value = '') {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

const MAX_ATTEMPTS = 6

const COLUMNS = [
  { label: 'Filme',     filmeKey: 'nome',      statusKey: null         },
  { label: 'Gênero',    filmeKey: 'genero',    statusKey: 'genero'     },
  { label: 'País',      filmeKey: 'paises',  statusKey: 'pais'     },
  { label: 'Ano',       filmeKey: 'lancamento',statusKey: 'lancamento' },
  { label: 'Receita',   filmeKey: 'receita',   statusKey: 'receita'    },
  { label: 'Produtora', filmeKey: 'produtora', statusKey: 'produtora'  },
  { label: 'Elenco',    filmeKey: 'elenco',    statusKey: 'elenco'     },
  { label: 'Diretor',   filmeKey: 'diretor',   statusKey: 'diretor'    },
]

// ─────────────────────────────────────────────────────────────────
// PAÍSES COM BANDEIRAS
// ─────────────────────────────────────────────────────────────────

function PaisesFlags({ paises }) {
  if (!Array.isArray(paises) || paises.length === 0) return <span>—</span>
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center', alignItems: 'center' }}>
      {paises.map((p, i) => {
        const nome     = typeof p === 'object' ? (p.nome ?? '') : String(p)
        const bandeira = typeof p === 'object'
          ? (p.bandeira ?? p.urlBandeira ?? p.flagUrl ?? p.flag_url ?? p.url ?? null)
          : null
        if (bandeira) {
          return (
            <img
              key={i}
              src={bandeira}
              alt={nome}
              title={nome}
              onError={(e) => { e.currentTarget.style.display = 'none' }}
              style={{ width: '26px', height: '18px', objectFit: 'cover', borderRadius: '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.5)', cursor: 'default' }}
            />
          )
        }
        return <span key={i} title={nome}>{nome}</span>
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────

export default function ModoDiario() {
  const navigate = useNavigate()

  const [moviesList,   setMoviesList]   = useState([])
  const [partidaId,    setPartidaId]    = useState(null)
  const [palpites,     setPalpites]     = useState([])
  const [gameOver,     setGameOver]     = useState(false)
  const [won,          setWon]          = useState(false)
  const [nomeAlvo,     setNomeAlvo]     = useState(null)
  const [loadingInit,  setLoadingInit]  = useState(true)
  const [initError,    setInitError]    = useState(false)

  const [query,    setQuery]    = useState('')
  const [selected, setSelected] = useState(null)
  const [showDrop, setShowDrop] = useState(false)
  const [loading,  setLoading]  = useState(false)

  const [dica,         setDica]         = useState([])
  const [dicaMostrada, setDicaMostrada] = useState(false)
  const [loadingDica,  setLoadingDica]  = useState(false)
  const [dicaError,    setDicaError]    = useState('')
  const [filmeRevelado,setFilmeRevelado]= useState(null)

  const inputRef = useRef(null)
  const dropRef  = useRef(null)

  useEffect(() => {
    async function init() {
      try {
        const [lista, partida] = await Promise.all([buscarFilmes(), iniciarPartida()])
        setMoviesList(lista)
        setPartidaId(partida.id ?? partida.partidaId ?? null)
        // Se já havia palpites (partida retomada), carrega
        if (partida.palpites?.length > 0) {
          setPalpites([...partida.palpites].reverse())
        }
      } catch (err) {
        console.error('Erro ao iniciar:', err)
        setInitError(true)
      } finally {
        setLoadingInit(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        dropRef.current  && !dropRef.current.contains(e.target) &&
        inputRef.current && !inputRef.current.contains(e.target)
      ) setShowDrop(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const guessedIds = new Set(palpites.map(p => String(p.filme?.id ?? '')).filter(Boolean))

  const q = normalizeText(query)
  const filtered = moviesList
    .filter(m => q.length > 0 && normalizeText(m.nome).startsWith(q) && !guessedIds.has(String(m.id)))
    .slice(0, 100)

  function handleSelect(movie) {
    setSelected(movie)
    setQuery(movie.nome)
    setShowDrop(false)
  }

  async function handleGuess() {
    if (!selected || loading || gameOver || !partidaId) return
    setLoading(true)
    try {
      const response = await enviarChute(partidaId, selected.id)
      const novosPalpites = response?.palpites ?? []
      setPalpites([...novosPalpites].reverse())

      const ultimo = novosPalpites[novosPalpites.length - 1]
      if (ultimo && palpiteAcertou(ultimo)) {
        setNomeAlvo(ultimo.filme?.nome ?? selected.nome)
        setWon(true)
        setGameOver(true)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setSelected(null)
      setQuery('')
    }
  }

  async function handleDesistir() {
    if (!partidaId || gameOver) return
    try {
      const filme = await desistir(partidaId)
      const revealPalpite = {
        id: '_reveal',
        _reveal: true,
        filme: filme ?? {},
        genero: 'CORRETO',
        pais: 'CORRETO',
        lancamento: 'CORRETO',
        receita: 'CORRETO',
        produtora: 'CORRETO',
        elenco: 'CORRETO',
        diretor: 'CORRETO',
      }
      setPalpites(prev => [revealPalpite, ...prev])
      setGameOver(true)
      setWon(false)
    } catch (err) {
      console.error(err)
    }
  }

  async function handleDica() {
    if (loadingDica || !partidaId || palpites.length < 5) return
    setLoadingDica(true)
    setDicaError('')
    try {
      const data = await buscarDica(partidaId)
      setDica(Array.isArray(data) ? data : [])
      setDicaMostrada(true)
    } catch {
      setDicaError('Não foi possível carregar a dica.')
    } finally {
      setLoadingDica(false)
    }
  }

  function renderCell(col, palpite) {
    const filme = palpite.filme ?? {}
    if (col.statusKey === null) {
      return (
        <div key={col.label} className={`fd-cell ${(palpiteAcertou(palpite) || palpite._reveal) ? 'correct' : 'wrong'}`}>
          {fmt(filme[col.filmeKey])}
        </div>
      )
    }
    const status   = palpite[col.statusKey]
    const cssClass = statusToClass(status)

    if (col.filmeKey === 'paises') {
      return (
        <div key={col.label} className={`fd-cell ${cssClass}`}>
          <PaisesFlags paises={filme.paises} />
        </div>
      )
    }

    const comSeta = col.filmeKey === 'lancamento' || col.filmeKey === 'receita'
    const valor   = col.filmeKey === 'receita' ? fmtReceita(filme[col.filmeKey]) : fmt(filme[col.filmeKey])
    const display = comSeta ? `${valor}${seta(status)}` : valor
    return (
      <div key={col.label} className={`fd-cell ${cssClass}`}>
        {display}
      </div>
    )
  }

  const podeDesistir = !gameOver && palpites.length > 0
  const podeDica     = !gameOver && palpites.length >= 5 && !dicaMostrada

  return (
    <div className="fd-page">
      <CinemaBackground />
      <button className="fd-back-btn" onClick={() => navigate('/')}>← Início</button>

      <div className="fd-container">

        <header className="fd-header">
          <div className="fd-logo-css">
            <span className="fd-logo-play">▶</span>
            <span className="fd-logo-name">FILMEDLE</span>
          </div>
          <span className="fd-mode-tag">Modo Diário</span>
        </header>

        {/* Dica mostrada (persiste mesmo após acertar/desistir) */}
        {dicaMostrada && dica.length > 0 && (
          <div className="fd-clue-box" style={{ marginTop: '1rem' }}>
            <div className="fd-clue-label">Dica</div>
            <div className="fd-clue-text">{dica.join(', ')}</div>
          </div>
        )}
        {dicaError && (
          <div style={{ color: 'var(--gold)', textAlign: 'center', marginTop: '1rem' }}>
            {dicaError}
          </div>
        )}

        {initError ? (
          <div style={{ color: 'red', textAlign: 'center', marginTop: '2rem' }}>
            Erro ao conectar com o servidor.{' '}
            <button
              onClick={() => window.location.reload()}
              style={{ color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Tentar novamente
            </button>
          </div>
        ) : loadingInit ? (
          <div className="fi-loading">
            <span className="fi-loading-dot" />
            <span className="fi-loading-dot" />
            <span className="fi-loading-dot" />
          </div>
        ) : (
          <>
            {/* Busca + botões de ação */}
            {!gameOver && (
              <>
                <div className="fd-search-wrapper">
                  <input
                    ref={inputRef}
                    className="fd-search-input"
                    type="text"
                    placeholder="Digite o nome do filme..."
                    value={query}
                    onChange={e => { setQuery(e.target.value); setSelected(null); setShowDrop(true) }}
                    onFocus={() => setShowDrop(true)}
                    autoComplete="off"
                  />
                  <span className="fd-search-icon">⌕</span>

                  {showDrop && query.length > 0 && (
                    <div className="fd-dropdown" ref={dropRef}>
                      {filtered.length === 0
                        ? <div className="fd-dropdown-empty">Nenhum filme encontrado</div>
                        : filtered.map(m => (
                            <div key={m.id} className="fd-dropdown-item" onMouseDown={() => handleSelect(m)}>
                              {m.nome}
                            </div>
                          ))
                      }
                    </div>
                  )}
                </div>

                <div className="fd-action-row">
                  <button
                    className="fd-btn-guess"
                    onClick={handleGuess}
                    disabled={!selected || loading}
                  >
                    {loading ? 'Verificando...' : <><span>▶</span> Confirmar <span className="fd-btn-arrow">→</span></>}
                  </button>

                  {podeDesistir && (
                    <button className="fd-btn-skip" onClick={handleDesistir} disabled={loading}>
                      Desistir ✕
                    </button>
                  )}

                  {podeDica && (
                    <button className="fd-btn-skip" onClick={handleDica} disabled={loadingDica}>
                      {loadingDica ? 'Buscando...' : '💡 Dica'}
                    </button>
                  )}

                  {!podeDica && !dicaMostrada && palpites.length < 5 && palpites.length > 0 && (
                    <button className="fd-btn-skip" disabled title="Disponível após 5 tentativas">
                      💡 Dica ({5 - palpites.length} tent. para liberar)
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Tabela de tentativas */}
            {palpites.length > 0 && (
              <section className="fd-attempts-section">
                <div className="fd-section-title">Tentativas</div>
                <div className="fd-col-headers">
                  {COLUMNS.map(c => <div key={c.label} className="fd-col-header">{c.label}</div>)}
                </div>
                {palpites.map((palpite, i) => (
                  <div key={palpite.id ?? i} className="fd-attempt-card" style={{ '--row-delay': `${i * 0.12}s` }}>
                    {COLUMNS.map(col => renderCell(col, palpite))}
                  </div>
                ))}
              </section>
            )}

            {/* Banner de resultado — só no win */}
            {gameOver && won && (
              <div className="fd-result-banner win">
                <div className="fd-result-emoji">🎬</div>
                <div className="fd-result-title win">Você Acertou!</div>
                <div className="fd-result-sub">
                  O filme era <strong>{nomeAlvo ?? 'desconhecido'}</strong> — acertou em {palpites.length} tentativa{palpites.length !== 1 ? 's' : ''}!
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}
