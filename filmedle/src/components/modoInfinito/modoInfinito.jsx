import React, { useEffect, useRef, useState } from 'react'
import './modoInfinito.css'

const BASE_URL = 'http://localhost:8080'

// ─────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────
async function buscarFilmes() {
  const res = await fetch(`${BASE_URL}/filme/filtro`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`Erro ao buscar filmes: ${res.status}`)
  const data = await res.json()
  const lista = Array.isArray(data) ? data : data?.content ?? data?.items ?? data?.filmes ?? data?.data ?? []
  return lista.map(f => ({ id: f.id, nome: f.nome ?? f.title ?? f.titulo ?? '' })).filter(f => f.id && f.nome)
}

async function iniciaPartida() {
  const res = await fetch(`${BASE_URL}/partida/inicia?modo=infinito`, {
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

async function buscarDicaAPI(partidaId) {
  const res = await fetch(`${BASE_URL}/partida/${partidaId}/dica`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`Erro ao buscar dica: ${res.status}`)
  return res.json()
}

async function desistirPartida(partidaId) {
  const res = await fetch(`${BASE_URL}/partida/${partidaId}/desistir`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
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

// Renderiza lista de países como bandeiras com tooltip
function PaisesFlags({ paises }) {
  if (!Array.isArray(paises) || paises.length === 0) return <span>—</span>
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center', alignItems: 'center' }}>
      {paises.map((p, i) => {
        const nome     = typeof p === 'object' ? (p.nome ?? '') : String(p)
        const bandeira = typeof p === 'object' ? (p.bandeira ?? null) : null
        if (bandeira) {
          return (
            <img
              key={i}
              src={bandeira}
              alt={nome}
              title={nome}
              style={{
                width: '28px',
                height: '20px',
                objectFit: 'cover',
                borderRadius: '3px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                cursor: 'default',
              }}
            />
          )
        }
        return <span key={i}>{nome}</span>
      })}
    </div>
  )
}

function palpiteAcertou(p) {
  return ['diretor', 'elenco', 'genero', 'lancamento', 'paises', 'produtora', 'receita']
    .every(c => String(p[c] ?? '').toUpperCase() === 'CORRETO')
}

function normalizeText(value = '') {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

function getStreakEmoji(streak) {
  if (streak >= 10) return '🔥🔥🔥'
  if (streak >= 7)  return '🔥🔥'
  if (streak >= 4)  return '🔥'
  if (streak >= 2)  return '⚡'
  return '🎬'
}

// ─────────────────────────────────────────────────────────────────
// COLUNAS
// ─────────────────────────────────────────────────────────────────
const COLUMNS = [
  { label: 'Filme',     filmeKey: 'nome',       statusKey: null          },
  { label: 'Gênero',    filmeKey: 'genero',      statusKey: 'genero'      },
  { label: 'País',      filmeKey: 'paises',      statusKey: 'paises'      },
  { label: 'Ano',       filmeKey: 'lancamento',  statusKey: 'lancamento'  },
  { label: 'Receita',   filmeKey: 'receita',     statusKey: 'receita'     },
  { label: 'Produtora', filmeKey: 'produtora',   statusKey: 'produtora'   },
  { label: 'Elenco',    filmeKey: 'elenco',      statusKey: 'elenco'      },
  { label: 'Diretor',   filmeKey: 'diretor',     statusKey: 'diretor'     },
]

// ─────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────
export default function ModoInfinito() {
  const bgSrc   = '/img/imagem_fundo_filmedle.jpg'
  const logoSrc = '/img/filmedle.png'

  const [moviesList,   setMoviesList]   = useState([])
  const [partidaId,    setPartidaId]    = useState(null)
  const [nomeAlvo,     setNomeAlvo]     = useState(null)
  const [palpites,     setPalpites]     = useState([])
  const [roundOver,    setRoundOver]    = useState(false)
  const [roundWon,     setRoundWon]     = useState(false)
  const [loadingRound, setLoadingRound] = useState(true)
  const [initError,    setInitError]    = useState(false)

  const [streak,        setStreak]        = useState(0)
  const [bestStreak,    setBestStreak]    = useState(0)
  const [totalSolved,   setTotalSolved]   = useState(0)
  const [totalAttempts, setTotalAttempts] = useState(0)

  const [query,    setQuery]    = useState('')
  const [selected, setSelected] = useState(null)
  const [showDrop, setShowDrop] = useState(false)
  const [loading,  setLoading]  = useState(false)

  const [dica,         setDica]         = useState([])
  const [loadingDica,  setLoadingDica]  = useState(false)
  const [dicaError,    setDicaError]    = useState('')
  const [dicaCooldown, setDicaCooldown] = useState(0)

  // Estado de desistência
  const [desistindo,   setDesistindo]   = useState(false)
  const [filmeRevelado, setFilmeRevelado] = useState(null)

  const inputRef = useRef(null)
  const dropRef  = useRef(null)

  useEffect(() => {
    buscarFilmes().then(setMoviesList).catch(err => { console.error(err); setInitError(true) })
    startNewRound()
  }, [])

  async function startNewRound() {
    setLoadingRound(true)
    setInitError(false)
    setPalpites([])
    setRoundOver(false)
    setRoundWon(false)
    setNomeAlvo(null)
    setQuery('')
    setSelected(null)
    setShowDrop(false)
    setDica([])
    setDicaError('')
    setDesistindo(false)
    setFilmeRevelado(null)

    try {
      const data = await iniciaPartida()
      setPartidaId(data.id ?? data.partidaId ?? null)
    } catch (err) {
      console.error('Erro ao iniciar rodada:', err)
      setInitError(true)
    } finally {
      setLoadingRound(false)
    }
  }

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
    if (!selected || loading || roundOver || !partidaId) return
    setLoading(true)

    try {
      const response = await enviarChute(partidaId, selected.id)
      console.log('response:', response)

      const novosPalpites = response?.palpites ?? []
      setPalpites([...novosPalpites].reverse())
      setTotalAttempts(t => t + 1)

      const ultimo = novosPalpites[novosPalpites.length - 1]
      if (ultimo && palpiteAcertou(ultimo)) {
        const newStreak = streak + 1
        setStreak(newStreak)
        setBestStreak(b => Math.max(b, newStreak))
        setTotalSolved(s => s + 1)
        setNomeAlvo(ultimo.filme?.nome ?? selected.nome)
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

  async function handleDesistir() {
    if (loading || desistindo || roundOver || !partidaId) return
    setDesistindo(true)

    try {
      const filmeData = await desistirPartida(partidaId)
      // filmeData = ResponseFilmeDTO retornado pelo backend
      const nomeFilme = filmeData?.nome ?? filmeData?.title ?? filmeData?.titulo ?? 'desconhecido'
      setFilmeRevelado(filmeData)
      setNomeAlvo(nomeFilme)
      setStreak(0)
      setRoundOver(true)
      setRoundWon(false)
    } catch (err) {
      console.error('Erro ao desistir:', err)
      // Mesmo com erro, encerra a rodada localmente
      setStreak(0)
      setRoundOver(true)
      setRoundWon(false)
    }
  }

  async function handleDica() {
    if (loadingDica || dicaCooldown > 0 || !partidaId) return
    if (palpites.length < 5) { setDicaError('A dica só fica disponível com 5 palpites.'); return }

    setLoadingDica(true)
    setDicaError('')
    try {
      const data = await buscarDicaAPI(partidaId)
      setDica(Array.isArray(data) ? data : [])
      setDicaCooldown(5)
    } catch {
      setDicaError('Não foi possível carregar a dica.')
    } finally {
      setLoadingDica(false)
    }
  }

  function handleNext() {
    setDicaCooldown(prev => Math.max(0, prev - 1))
    startNewRound()
  }

  function renderCell(col, palpite) {
    const filme = palpite.filme ?? {}

    if (col.statusKey === null) {
      return (
        <div key={col.label} className="fi-cell wrong">
          {fmt(filme[col.filmeKey])}
        </div>
      )
    }

    const status   = palpite[col.statusKey]
    const cssClass = statusToClass(status)

    // Países → bandeiras com tooltip
    if (col.filmeKey === 'paises') {
      return (
        <div key={col.label} className={`fi-cell ${cssClass}`}>
          <PaisesFlags paises={filme.paises} />
        </div>
      )
    }

    // Ano e Receita → mostram seta de direção
    const comSeta = col.filmeKey === 'lancamento' || col.filmeKey === 'receita'
    const valor   = fmt(filme[col.filmeKey])
    const display = comSeta ? `${valor}${seta(status)}` : valor

    return (
      <div key={col.label} className={`fi-cell ${cssClass}`}>
        {display}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="fi-page">
      {bgSrc && <img src={bgSrc} alt="" className="fi-bg" />}
      {bgSrc && <div className="fi-overlay" />}

      <div className="fi-container">
        <header className="fi-header">
          {logoSrc
            ? <img src={logoSrc} alt="Filmedle" className="fi-logo-img" />
            : <h1 className="fi-logo">Filmedle</h1>}
          <span className="fi-mode-tag">◆ Modo Infinito</span>
        </header>

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

        <div className="fi-clue-box">
          <div className="fi-clue-label">Modo Infinito</div>
          <div className="fi-clue-text">
            Sem limites — adivinhe quantos filmes quiser!
            Campos em <span style={{ color: 'var(--green)' }}>verde</span> = acerto,&nbsp;
            <span style={{ color: 'var(--gold)' }}>amarelo</span> = próximo,&nbsp;
            <span style={{ color: '#f88' }}>vermelho</span> = errado.
            {palpites.length > 0 && !roundOver && (
              <> · <strong style={{ color: 'var(--red-bright)' }}>{palpites.length}</strong> tentativa{palpites.length !== 1 ? 's' : ''} nesta rodada.</>
            )}
          </div>
        </div>

        {dicaError && (
          <div style={{ color: 'var(--gold)', textAlign: 'center', marginTop: '1rem' }}>
            {dicaError}
          </div>
        )}

        {dica.length > 0 && (
          <div className="fi-clue-box" style={{ marginTop: '1rem' }}>
            <div className="fi-clue-label">Dica</div>
            <div className="fi-clue-text">{dica.join(', ')}</div>
          </div>
        )}

        {initError ? (
          <div style={{ color: 'red', textAlign: 'center', marginTop: '2rem' }}>
            Erro ao conectar com o servidor.{' '}
            <button onClick={startNewRound} style={{ color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
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
            {/* Área de input: some quando desistiu ou rodada acabou */}
            {!roundOver && (
              <>
                <div className="fi-search-wrapper">
                  <input
                    ref={inputRef}
                    className="fi-search-input"
                    type="text"
                    placeholder="Digite o nome do filme..."
                    value={query}
                    onChange={e => { setQuery(e.target.value); setSelected(null); setShowDrop(true) }}
                    onFocus={() => setShowDrop(true)}
                    autoComplete="off"
                    disabled={desistindo}
                  />
                  <span className="fi-search-icon">⌕</span>

                  {showDrop && query.length > 0 && !desistindo && (
                    <div className="fi-dropdown" ref={dropRef}>
                      {filtered.length === 0
                        ? <div className="fi-dropdown-empty">Nenhum filme encontrado</div>
                        : filtered.map(m => (
                            <div key={m.id} className="fi-dropdown-item" onMouseDown={() => handleSelect(m)}>
                              <span className="fi-item-id">#{m.id}</span>
                              {m.nome}
                            </div>
                          ))
                      }
                    </div>
                  )}
                </div>

                {/* Botões: somem ao desistir */}
                {!desistindo && (
                  <div className="fi-action-row">
                    <button className="fi-btn-guess" onClick={handleGuess} disabled={!selected || loading}>
                      {loading ? 'Verificando...' : <><span>▶</span> Confirmar <span className="fi-btn-arrow">→</span></>}
                    </button>

                    <button
                      className="fi-btn-skip"
                      onClick={handleDesistir}
                      disabled={loading}
                      title="Desistir desta rodada (perde a sequência)"
                    >
                      Desistir ✕
                    </button>

                    <button
                      className="fi-btn-skip"
                      onClick={handleDica}
                      disabled={loading || loadingDica || palpites.length < 5 || dicaCooldown > 0}
                      title={dicaCooldown > 0 ? `A próxima dica libera em ${dicaCooldown} filme(s)` : 'Liberada após 5 palpites'}
                    >
                      {loadingDica ? 'Buscando...' : dicaCooldown > 0 ? `💡 Dica (${dicaCooldown})` : '💡 Dica'}
                    </button>
                  </div>
                )}

                {/* Spinner de desistência enquanto aguarda resposta da API */}
                {desistindo && !roundOver && (
                  <div className="fi-loading" style={{ marginTop: '1rem' }}>
                    <span className="fi-loading-dot" />
                    <span className="fi-loading-dot" />
                    <span className="fi-loading-dot" />
                  </div>
                )}
              </>
            )}

            {palpites.length > 0 && (
              <section className="fi-attempts-section">
                <div className="fi-section-title">Tentativas desta Rodada</div>

                <div className="fi-col-headers">
                  {COLUMNS.map(c => <div key={c.label} className="fi-col-header">{c.label}</div>)}
                </div>

                {palpites.map((palpite, i) => (
                  <div key={palpite.id ?? i} className="fi-attempt-card" style={{ animationDelay: `${i * 0.04}s` }}>
                    {COLUMNS.map(col => renderCell(col, palpite))}
                  </div>
                ))}
              </section>
            )}

            {roundOver && (
              <div className={`fi-result-banner ${roundWon ? 'win' : 'skip'}`}>
                <div className="fi-result-emoji">{roundWon ? getStreakEmoji(streak) : '🏳️'}</div>
                <div className={`fi-result-title ${roundWon ? 'win' : 'skip'}`}>
                  {roundWon ? 'Acertou!' : 'Você Desistiu'}
                </div>
                <div className="fi-result-sub">
                  {roundWon ? (
                    <>
                      O filme era <strong>{nomeAlvo ?? 'desconhecido'}</strong> — acertou em {palpites.length} tentativa{palpites.length !== 1 ? 's' : ''}!
                      {streak > 1 && <> Sequência: <strong style={{ color: 'var(--gold)' }}>{streak} 🔥</strong></>}
                    </>
                  ) : (
                    <>O filme era <strong>{nomeAlvo ?? 'desconhecido'}</strong>. Sequência perdida.</>
                  )}
                </div>

                <div className="fi-round-stats">
                  <div className="fi-rstat"><span>{streak}</span><small>Sequência atual</small></div>
                  <div className="fi-rstat"><span>{bestStreak}</span><small>Melhor sequência</small></div>
                  <div className="fi-rstat"><span>{totalSolved}</span><small>Total acertados</small></div>
                </div>

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