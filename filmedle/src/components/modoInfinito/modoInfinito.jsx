import React, { useState, useRef, useEffect } from 'react'
import './ModoInfinito.css'

// ─────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────

const BASE_URL = 'http://localhost:8080' // ajuste para sua URL de produção

// ─────────────────────────────────────────────────────────────────
// MOCK DATA — substitua pela chamada real à sua API
// ─────────────────────────────────────────────────────────────────

const MOVIES_LIST = [
  { id: 1,  nome: 'O Poderoso Chefão' },
  { id: 2,  nome: 'Pulp Fiction' },
  { id: 3,  nome: 'Matrix' },
  { id: 4,  nome: 'Interestelar' },
  { id: 5,  nome: 'Clube da Luta' },
  { id: 6,  nome: 'Vingadores: Ultimato' },
  { id: 7,  nome: 'Parasita' },
  { id: 8,  nome: 'Coringa' },
  { id: 9,  nome: 'O Senhor dos Anéis: O Retorno do Rei' },
  { id: 10, nome: 'Cidade de Deus' },
]

const MOCK_MOVIES_DATA = {
  1:  { nome: 'O Poderoso Chefão', genero: 'Crime',    pais: 'EUA',      ano: 1972, receita: 'US$ 246 mi',  produtora: 'Paramount',   elenco: 'Brando, Pacino, Keaton',    diretor: 'Coppola'    },
  2:  { nome: 'Pulp Fiction',       genero: 'Crime',    pais: 'EUA',      ano: 1994, receita: 'US$ 213 mi',  produtora: 'Miramax',     elenco: 'Travolta, Jackson, Thurman', diretor: 'Tarantino'  },
  3:  { nome: 'Matrix',             genero: 'Ficção',   pais: 'EUA',      ano: 1999, receita: 'US$ 467 mi',  produtora: 'Warner Bros', elenco: 'Reeves, Fishburne, Moss',   diretor: 'Wachowski'  },
  4:  { nome: 'Interestelar',       genero: 'Ficção',   pais: 'EUA/UK',   ano: 2014, receita: 'US$ 677 mi',  produtora: 'Paramount',   elenco: 'McConaughey, Hathaway',     diretor: 'Nolan'      },
  5:  { nome: 'Clube da Luta',      genero: 'Drama',    pais: 'EUA',      ano: 1999, receita: 'US$ 101 mi',  produtora: 'Fox 2000',    elenco: 'Pitt, Norton, Bonham',      diretor: 'Fincher'    },
  6:  { nome: 'Vingadores: Ultimato', genero: 'Ação',   pais: 'EUA',      ano: 2019, receita: 'US$ 2,79 bi', produtora: 'Marvel',      elenco: 'Downey Jr, Evans, Johansson',diretor: 'Russo'     },
  7:  { nome: 'Parasita',           genero: 'Thriller', pais: 'Coreia',   ano: 2019, receita: 'US$ 258 mi',  produtora: 'Barunson E&A',elenco: 'Song Kang-ho, Lee Sun-kyun',diretor: 'Bong'       },
  8:  { nome: 'Coringa',            genero: 'Drama',    pais: 'EUA',      ano: 2019, receita: 'US$ 1,07 bi', produtora: 'Warner Bros', elenco: 'Phoenix, DeNiro',           diretor: 'Phillips'   },
  9:  { nome: 'O Senhor dos Anéis: O Retorno do Rei', genero: 'Fantasia', pais: 'NZ/EUA', ano: 2003, receita: 'US$ 1,14 bi', produtora: 'New Line', elenco: 'Wood, McKellen, Mortensen', diretor: 'Jackson' },
  10: { nome: 'Cidade de Deus',     genero: 'Drama',    pais: 'Brasil',   ano: 2002, receita: 'US$ 30 mi',   produtora: 'O2 Filmes',   elenco: 'Haagensen, da Hora',        diretor: 'Meirelles' },
}

// ─────────────────────────────────────────────────────────────────
// API INTEGRATION
// ─────────────────────────────────────────────────────────────────

/**
 * Chama POST /partida/inicia para iniciar uma nova partida.
 * Retorna ResponsePartidaDTO: { id, filme, palpites }
 */
async function iniciaPartida() {
  const res = await fetch(`${BASE_URL}/partida/inicia`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`Erro ao iniciar partida: ${res.status}`)
  return res.json() // ResponsePartidaDTO
}

/**
 * Busca o resultado de uma tentativa.
 * Em produção: substitua pelo endpoint real de chute.
 * POST /partida/{idPartida}/chute/{idChute}
 */
async function fetchGuessResult(movieId) {
  await new Promise(r => setTimeout(r, 250))
  const data = MOCK_MOVIES_DATA[movieId]
  if (!data) throw new Error('Filme não encontrado')
  return data
}

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

const COLUMNS = [
  { key: 'nome',      label: 'Filme' },
  { key: 'genero',    label: 'Gênero' },
  { key: 'pais',      label: 'País' },
  { key: 'ano',       label: 'Ano' },
  { key: 'receita',   label: 'Receita' },
  { key: 'produtora', label: 'Produtora' },
  { key: 'elenco',    label: 'Elenco' },
  { key: 'diretor',   label: 'Diretor' },
]

function compareCell(field, value, target) {
  if (value === target) return 'correct'
  if (field === 'ano') {
    return Math.abs(value - target) <= 5 ? 'partial' : 'wrong'
  }
  if (typeof value === 'string' && typeof target === 'string') {
    const v = value.toLowerCase(), t = target.toLowerCase()
    if (v.includes(t) || t.includes(v)) return 'partial'
  }
  return 'wrong'
}

function yearArrow(guessedYear, targetYear) {
  if (guessedYear === targetYear) return ''
  return guessedYear < targetYear ? ' ↑' : ' ↓'
}

function getStreakEmoji(streak) {
  if (streak >= 10) return '🔥🔥🔥'
  if (streak >= 7)  return '🔥🔥'
  if (streak >= 4)  return '🔥'
  if (streak >= 2)  return '⚡'
  return '🎬'
}

// ─────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────

export default function ModoInfinito() {
  const bgSrc   = "/img/imagem_fundo_filmedle.jpg"
  const logoSrc = "/img/filmedle.png"

  // ── partida vinda do backend
  const [partidaId,    setPartidaId]    = useState(null)
  const [targetId,     setTargetId]     = useState(null)  // filme.id
  const [targetData,   setTargetData]   = useState(null)  // dados do filme alvo

  // ── round state
  const [attempts,     setAttempts]     = useState([])
  const [roundOver,    setRoundOver]    = useState(false)
  const [roundWon,     setRoundWon]     = useState(false)
  const [loadingRound, setLoadingRound] = useState(true)
  const [initError,    setInitError]    = useState(false)

  // ── session stats
  const [streak,        setStreak]        = useState(0)
  const [bestStreak,    setBestStreak]    = useState(0)
  const [totalSolved,   setTotalSolved]   = useState(0)
  const [totalAttempts, setTotalAttempts] = useState(0)

  // ── search state
  const [query,    setQuery]    = useState('')
  const [selected, setSelected] = useState(null)
  const [showDrop, setShowDrop] = useState(false)
  const [loading,  setLoading]  = useState(false)

  const inputRef = useRef(null)
  const dropRef  = useRef(null)

  // ── inicia primeira rodada ao montar
  useEffect(() => {
    startNewRound()
  }, [])

  // ─────────────────────────────────────
  // Inicia uma nova rodada chamando POST /partida/inicia
  // ─────────────────────────────────────
  async function startNewRound() {
    setLoadingRound(true)
    setInitError(false)
    setAttempts([])
    setRoundOver(false)
    setRoundWon(false)
    setQuery('')
    setSelected(null)

    try {
      const data = await iniciaPartida()
      // data.filme.id → ID do filme correto
      const filmeId = data.filme?.id
      setPartidaId(data.id)
      setTargetId(filmeId)

      // TODO: quando Filme tiver todos os campos, substitua por: setTargetData(data.filme)
      setTargetData(MOCK_MOVIES_DATA[filmeId] ?? null)
    } catch (err) {
      console.error('Erro ao iniciar rodada:', err)
      setInitError(true)
    } finally {
      setLoadingRound(false)
    }
  }

  // ── fecha dropdown ao clicar fora
  useEffect(() => {
    function handle(e) {
      if (dropRef.current && !dropRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setShowDrop(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const guessedIds = attempts.map(a => a._movieId)

  const filtered = MOVIES_LIST.filter(m =>
    m.nome.toLowerCase().includes(query.toLowerCase()) &&
    !guessedIds.includes(m.id)
  )

  function handleSelect(movie) {
    setSelected(movie)
    setQuery(movie.nome)
    setShowDrop(false)
  }

  async function handleGuess() {
    if (!selected || loading || roundOver || !targetId) return
    setLoading(true)
    try {
      const result   = await fetchGuessResult(selected.id)
      const enriched = { ...result, _movieId: selected.id }
      const newAttempts = [enriched, ...attempts]
      setAttempts(newAttempts)
      setTotalAttempts(t => t + 1)

      if (selected.id === targetId) {
        const newStreak = streak + 1
        setStreak(newStreak)
        setBestStreak(b => Math.max(b, newStreak))
        setTotalSolved(s => s + 1)
        setRoundWon(true)
        setRoundOver(true)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setSelected(null)
      setQuery('')
    }
  }

  function handleSkip() {
    setStreak(0)
    setRoundOver(true)
    setRoundWon(false)
  }

  // Chama um novo POST /partida/inicia para a próxima rodada
  function handleNext() {
    startNewRound()
  }

  // ─────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────

  return (
    <div className="fi-page">

      {bgSrc && <img src={bgSrc} alt="" className="fi-bg" />}
      {bgSrc && <div className="fi-overlay" />}

      <div className="fi-container">

        {/* ── HEADER ── */}
        <header className="fi-header">
          {logoSrc
            ? <img src={logoSrc} alt="Filmedle" className="fi-logo-img" />
            : <h1 className="fi-logo">Filmedle</h1>
          }
          <span className="fi-mode-tag">◆ Modo Infinito</span>
        </header>

        {/* ── STATS BAR ── */}
        <div className="fi-stats-bar">
          <div className="fi-stat">
            <span className="fi-stat-value">{getStreakEmoji(streak)} {streak}</span>
            <span className="fi-stat-label">Sequência</span>
          </div>
          <div className="fi-stat-divider" />
          <div className="fi-stat">
            <span className="fi-stat-value">{bestStreak}</span>
            <span className="fi-stat-label">Melhor</span>
          </div>
          <div className="fi-stat-divider" />
          <div className="fi-stat">
            <span className="fi-stat-value">{totalSolved}</span>
            <span className="fi-stat-label">Acertos</span>
          </div>
          <div className="fi-stat-divider" />
          <div className="fi-stat">
            <span className="fi-stat-value">{totalAttempts}</span>
            <span className="fi-stat-label">Tentativas</span>
          </div>
        </div>

        {/* ── ROUND INFO ── */}
        <div className="fi-clue-box">
          <div className="fi-clue-label">Modo Infinito</div>
          <div className="fi-clue-text">
            Sem limites — adivinhe quantos filmes quiser!
            Campos em <span style={{ color: 'var(--green)' }}>verde</span> = acerto,&nbsp;
            <span style={{ color: 'var(--gold)' }}>amarelo</span> = próximo,&nbsp;
            <span style={{ color: '#f88' }}>vermelho</span> = errado.
            {attempts.length > 0 && !roundOver && (
              <> &nbsp;·&nbsp; <strong style={{ color: 'var(--red-bright)' }}>{attempts.length}</strong> tentativa{attempts.length !== 1 ? 's' : ''} nesta rodada.</>
            )}
          </div>
        </div>

        {/* ── LOADING / ERROR ── */}
        {initError ? (
          <div style={{ color: 'red', textAlign: 'center', marginTop: '2rem' }}>
            Erro ao conectar com o servidor.{' '}
            <button
              onClick={startNewRound}
              style={{ color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Tentar novamente
            </button>
          </div>
        ) : loadingRound ? (
          <div className="fi-loading">
            <span className="fi-loading-dot" />
            <span className="fi-loading-dot" />
            <span className="fi-loading-dot" />
          </div>
        ) : (
          <>
            {/* ── SEARCH ── */}
            {!roundOver && (
              <>
                <div className="fi-search-wrapper">
                  <input
                    ref={inputRef}
                    className="fi-search-input"
                    type="text"
                    placeholder="Digite o nome do filme..."
                    value={query}
                    onChange={e => {
                      setQuery(e.target.value)
                      setSelected(null)
                      setShowDrop(true)
                    }}
                    onFocus={() => setShowDrop(true)}
                    autoComplete="off"
                  />
                  <span className="fi-search-icon">⌕</span>

                  {showDrop && query.length > 0 && (
                    <div className="fi-dropdown" ref={dropRef}>
                      {filtered.length === 0 ? (
                        <div className="fi-dropdown-empty">Nenhum filme encontrado</div>
                      ) : (
                        filtered.map(m => (
                          <div
                            key={m.id}
                            className="fi-dropdown-item"
                            onMouseDown={() => handleSelect(m)}
                          >
                            <span className="fi-item-id">#{m.id}</span>
                            {m.nome}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className="fi-action-row">
                  <button
                    className="fi-btn-guess"
                    onClick={handleGuess}
                    disabled={!selected || loading}
                  >
                    {loading ? 'Verificando...' : (
                      <><span>▶</span> Confirmar <span className="fi-btn-arrow">→</span></>
                    )}
                  </button>
                  <button
                    className="fi-btn-skip"
                    onClick={handleSkip}
                    disabled={loading}
                    title="Pular este filme (perde a sequência)"
                  >
                    Pular ⟶
                  </button>
                </div>
              </>
            )}

            {/* ── ATTEMPTS TABLE ── */}
            {attempts.length > 0 && (
              <section className="fi-attempts-section">
                <div className="fi-section-title">Tentativas desta Rodada</div>

                <div className="fi-col-headers">
                  {COLUMNS.map(c => (
                    <div key={c.key} className="fi-col-header">{c.label}</div>
                  ))}
                </div>

                {attempts.map((attempt, i) => (
                  <div
                    key={i}
                    className="fi-attempt-card"
                    style={{ animationDelay: `${i * 0.04}s` }}
                  >
                    {COLUMNS.map(col => {
                      const status = col.key === 'nome'
                        ? (attempt._movieId === targetId ? 'correct' : 'wrong')
                        : compareCell(col.key, attempt[col.key], targetData[col.key])

                      const displayVal = col.key === 'ano'
                        ? `${attempt[col.key]}${yearArrow(attempt[col.key], targetData.ano)}`
                        : attempt[col.key]

                      return (
                        <div key={col.key} className={`fi-cell ${status}`}>
                          {displayVal}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </section>
            )}

            {/* ── ROUND RESULT ── */}
            {roundOver && (
              <div className={`fi-result-banner ${roundWon ? 'win' : 'skip'}`}>
                <div className="fi-result-emoji">
                  {roundWon ? getStreakEmoji(streak) : '⏭️'}
                </div>
                <div className={`fi-result-title ${roundWon ? 'win' : 'skip'}`}>
                  {roundWon ? 'Acertou!' : 'Filme Pulado'}
                </div>
                <div className="fi-result-sub">
                  {roundWon ? (
                    <>
                      O filme era <strong>{targetData?.nome}</strong> — acertou em {attempts.length} tentativa{attempts.length !== 1 ? 's' : ''}!
                      {streak > 1 && <> Sequência: <strong style={{ color: 'var(--gold)' }}>{streak} 🔥</strong></>}
                    </>
                  ) : (
                    <>O filme era <strong>{targetData?.nome}</strong>. Sequência perdida.</>
                  )}
                </div>

                {/* mini stats after round */}
                <div className="fi-round-stats">
                  <div className="fi-rstat">
                    <span>{streak}</span>
                    <small>Sequência atual</small>
                  </div>
                  <div className="fi-rstat">
                    <span>{bestStreak}</span>
                    <small>Melhor sequência</small>
                  </div>
                  <div className="fi-rstat">
                    <span>{totalSolved}</span>
                    <small>Total acertados</small>
                  </div>
                </div>

                {/* Botão chama POST /partida/inicia para nova rodada */}
                <button className="fi-btn-next" onClick={handleNext}>
                  {roundWon ? 'Próximo Filme ▶' : 'Jogar Novamente ▶'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}