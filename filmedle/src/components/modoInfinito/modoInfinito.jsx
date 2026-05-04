import React, { useEffect, useRef, useState } from 'react'
import './ModoInfinito.css'

// ─────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────
const BASE_URL = 'http://localhost:8080'

// ─────────────────────────────────────────────────────────────────
// API INTEGRATION
// ─────────────────────────────────────────────────────────────────
async function buscarFilmes() {
  const res = await fetch(`${BASE_URL}/filme/buscar`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    throw new Error(`Erro ao buscar filmes: ${res.status}`)
  }

  const data = await res.json()

  const lista =
    Array.isArray(data)
      ? data
      : data?.content ??
        data?.items ??
        data?.filmes ??
        data?.data ??
        []

  return lista
    .map(f => normalizeMovie(f))
    .filter(Boolean)
}

async function iniciaPartida() {
  const res = await fetch(`${BASE_URL}/partida/inicia`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    throw new Error(`Erro ao iniciar partida: ${res.status}`)
  }

  return res.json()
}

async function enviarChute(partidaId, chuteId) {
  const res = await fetch(`${BASE_URL}/partida/${partidaId}/chute/${chuteId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    throw new Error(`Erro ao enviar chute: ${res.status}`)
  }

  const text = await res.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

async function buscarDicaAPI(partidaId) {
  const res = await fetch(`${BASE_URL}/partida/${partidaId}/dica`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Erro ao buscar dica: ${res.status}`)
  }

  return res.json()
}

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────
const COLUMNS = [
  { key: 'nome', label: 'Filme' },
  { key: 'genero', label: 'Gênero' },
  { key: 'pais', label: 'País' },
  { key: 'ano', label: 'Ano' },
  { key: 'receita', label: 'Receita' },
  { key: 'produtora', label: 'Produtora' },
  { key: 'elenco', label: 'Elenco' },
  { key: 'diretor', label: 'Diretor' },
]

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function normalizeId(value) {
  return value == null ? null : String(value)
}

function extractName(item) {
  if (item == null) return ''
  if (typeof item === 'string' || typeof item === 'number') return String(item)
  if (typeof item === 'object') {
    return (
      item.nome ??
      item.name ??
      item.titulo ??
      item.title ??
      item.descricao ??
      item.description ??
      ''
    )
  }
  return ''
}

function joinValues(value) {
  if (Array.isArray(value)) {
    return value
      .map(extractName)
      .filter(Boolean)
      .join(', ')
  }

  if (value == null) return ''
  return extractName(value) || String(value)
}

function normalizeMovie(payload, fallbackId = null) {
  if (!payload || typeof payload !== 'object') return null

  const paises = payload.paises ?? payload.pais ?? payload.country ?? payload.countries
  const genero = payload.genero ?? payload.genre
  const produtora = payload.produtora ?? payload.studio
  const elenco = payload.elenco ?? payload.cast

  return {
    id: payload.id ?? payload.filmeId ?? payload.movieId ?? fallbackId,
    nome: payload.nome ?? payload.title ?? payload.titulo ?? '',
    genero: joinValues(genero),
    pais: joinValues(paises),
    ano: payload.lancamento ?? payload.ano ?? payload.year ?? null,
    receita: payload.receita ?? payload.revenue ?? '',
    produtora: joinValues(produtora),
    elenco: joinValues(elenco),
    diretor: payload.diretor ?? payload.director ?? '',
  }
}

function getMovieFromPayload(payload, fallbackId = null) {
  if (!payload) return null

  const directMovie =
    payload.filme ??
    payload.movie ??
    payload.target ??
    payload.tentativa ??
    payload.palpite

  return normalizeMovie(directMovie ?? payload, fallbackId)
}

function compareCell(field, value, target) {
  if (value == null || target == null) return 'wrong'

  if (field === 'ano') {
    const v = Number(value)
    const t = Number(target)
    if (Number.isFinite(v) && Number.isFinite(t)) {
      if (v === t) return 'correct'
      if (Math.abs(v - t) <= 5) return 'partial'
    }
    return 'wrong'
  }

  const vRaw = Array.isArray(value) ? value.join(', ') : String(value)
  const tRaw = Array.isArray(target) ? target.join(', ') : String(target)

  if (vRaw === tRaw) return 'correct'

  const v = normalizeText(vRaw)
  const t = normalizeText(tRaw)

  if (!v || !t) return 'wrong'
  if (v.includes(t) || t.includes(v)) return 'partial'

  return 'wrong'
}

function yearArrow(guessedYear, targetYear) {
  const g = Number(guessedYear)
  const t = Number(targetYear)
  if (!Number.isFinite(g) || !Number.isFinite(t) || g === t) return ''
  return g < t ? ' ↑' : ' ↓'
}

function getStreakEmoji(streak) {
  if (streak >= 10) return '🔥🔥🔥'
  if (streak >= 7) return '🔥🔥'
  if (streak >= 4) return '🔥'
  if (streak >= 2) return '⚡'
  return '🎬'
}

function isCorrectGuess(response, selectedId, targetId) {
  if (response && typeof response === 'object') {
    if (typeof response.acertou === 'boolean') return response.acertou
    if (typeof response.correct === 'boolean') return response.correct
    if (typeof response.correto === 'boolean') return response.correto

    if (typeof response.status === 'string') {
      const s = response.status.toLowerCase()
      if (s.includes('acert') || s.includes('correct')) return true
      if (s.includes('err') || s.includes('wrong')) return false
    }
  }

  return normalizeId(selectedId) === normalizeId(targetId)
}

function normalizePalpites(palpites) {
  if (!Array.isArray(palpites)) return []

  return palpites.map((p, index) => {
    const movie =
      normalizeMovie(
        p?.filme ??
          p?.movie ??
          p?.tentativa ??
          p?.palpite ??
          p,
        p?.id ?? index
      ) ?? {}

    return {
      ...movie,
      _movieId: normalizeId(movie.id ?? p?.filme?.id ?? p?.movie?.id ?? p?.id),
    }
  })
}

// ─────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────
export default function ModoInfinito() {
  const bgSrc = '/img/imagem_fundo_filmedle.jpg'
  const logoSrc = '/img/filmedle.png'

  const [moviesList, setMoviesList] = useState([])

  const [partidaId, setPartidaId] = useState(null)
  const [targetId, setTargetId] = useState(null)
  const [targetData, setTargetData] = useState(null)

  const [attempts, setAttempts] = useState([])
  const [roundOver, setRoundOver] = useState(false)
  const [roundWon, setRoundWon] = useState(false)
  const [loadingRound, setLoadingRound] = useState(true)
  const [initError, setInitError] = useState(false)

  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [totalSolved, setTotalSolved] = useState(0)
  const [totalAttempts, setTotalAttempts] = useState(0)

  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [showDrop, setShowDrop] = useState(false)
  const [loading, setLoading] = useState(false)

  // DICA
  const [dica, setDica] = useState([])
  const [loadingDica, setLoadingDica] = useState(false)
  const [dicaError, setDicaError] = useState('')
  const [dicaCooldown, setDicaCooldown] = useState(0)

  const inputRef = useRef(null)
  const dropRef = useRef(null)

  useEffect(() => {
    async function init() {
      try {
        const filmes = await buscarFilmes()
        setMoviesList(filmes)
      } catch (err) {
        console.error('Erro ao carregar filmes:', err)
        setInitError(true)
      } finally {
        startNewRound()
      }
    }

    init()
  }, [])

  async function startNewRound() {
    setLoadingRound(true)
    setInitError(false)
    setAttempts([])
    setRoundOver(false)
    setRoundWon(false)
    setQuery('')
    setSelected(null)
    setShowDrop(false)
    setDica([])
    setDicaError('')

    try {
      const data = await iniciaPartida()
      const filmeId = data?.filme?.id ?? data?.movie?.id ?? data?.filmeId ?? data?.movieId ?? null
      const backendTarget = getMovieFromPayload(
        data?.filme ?? data?.movie ?? data?.target ?? data,
        filmeId
      )

      console.log('Filme correto da rodada:', {
        id: backendTarget?.id ?? filmeId,
        nome: backendTarget?.nome,
      })

      setPartidaId(data?.id ?? data?.partidaId ?? null)
      setTargetId(normalizeId(filmeId))
      setTargetData(backendTarget)
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
        dropRef.current && !dropRef.current.contains(e.target) &&
        inputRef.current && !inputRef.current.contains(e.target)
      ) {
        setShowDrop(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const guessedIds = new Set(
    attempts.map(a => normalizeId(a._movieId ?? a.id)).filter(Boolean)
  )

  const q = normalizeText(query)

  const filtered = moviesList
    .filter(m => {
      const nome = normalizeText(m.nome)
      const id = normalizeId(m.id)

      return q.length > 0 && nome.startsWith(q) && !guessedIds.has(id)
    })
    .slice(0, 100)

  function handleSelect(movie) {
    setSelected(movie)
    setQuery(movie.nome)
    setShowDrop(false)
  }

  async function handleGuess() {
    if (!selected || loading || roundOver || !targetId || !partidaId) return

    setLoading(true)
    try {
      let response = null

      try {
        response = await enviarChute(partidaId, selected.id)
      } catch (apiError) {
        console.error('Falha ao enviar chute para a API:', apiError)
      }

      const partidaAtualizada = response ?? {}

      const novoTarget = getMovieFromPayload(
        partidaAtualizada.filme ?? partidaAtualizada.movie ?? partidaAtualizada.target ?? partidaAtualizada,
        targetId
      )

      if (novoTarget) {
        setTargetData(novoTarget)
        setTargetId(normalizeId(novoTarget.id ?? targetId))
      }

      const palpitesBackend = normalizePalpites(partidaAtualizada.palpites)

      if (palpitesBackend.length > 0) {
        setAttempts(palpitesBackend.reverse())
      } else {
        const guessedMovie = {
          id: selected.id,
          nome: selected.nome,
          genero: selected.genero,
          pais: selected.pais,
          ano: selected.ano,
          receita: selected.receita,
          produtora: selected.produtora,
          elenco: selected.elenco,
          diretor: selected.diretor,
          _movieId: selected.id,
        }

        setAttempts(prev => [guessedMovie, ...prev])
      }

      setTotalAttempts(t => t + 1)

      const correct = isCorrectGuess(response, selected.id, targetId)
      if (correct) {
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

  async function handleDica() {
    if (loadingDica || dicaCooldown > 0) return

    if (!partidaId) {
      setDicaError('Partida ainda não iniciada.')
      return
    }

    if (attempts.length < 5) {
      setDicaError('A dica só fica disponível com 5 palpites.')
      return
    }

    setLoadingDica(true)
    setDicaError('')

    try {
      const data = await buscarDicaAPI(partidaId)
      setDica(Array.isArray(data) ? data : [])
      setDicaCooldown(5)
    } catch (err) {
      console.error('Erro ao buscar dica:', err)
      setDicaError('Não foi possível carregar a dica.')
    } finally {
      setLoadingDica(false)
    }
  }

  function handleNext() {
    setDicaCooldown(prev => (prev > 0 ? prev - 1 : 0))
    startNewRound()
  }

  return (
    <div className="fi-page">
      {bgSrc && <img src={bgSrc} alt="" className="fi-bg" />}
      {bgSrc && <div className="fi-overlay" />}

      <div className="fi-container">
        <header className="fi-header">
          {logoSrc ? (
            <img src={logoSrc} alt="Filmedle" className="fi-logo-img" />
          ) : (
            <h1 className="fi-logo">Filmedle</h1>
          )}
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
            {attempts.length > 0 && !roundOver && (
              <>
                {' '}·{' '}
                <strong style={{ color: 'var(--red-bright)' }}>{attempts.length}</strong> tentativa{attempts.length !== 1 ? 's' : ''} nesta rodada.
              </>
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
            <div className="fi-clue-text">
              {dica.join(', ')}
            </div>
          </div>
        )}

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

                  <button
                    className="fi-btn-skip"
                    onClick={handleDica}
                    disabled={loading || loadingDica || attempts.length < 5 || dicaCooldown > 0}
                    title={
                      dicaCooldown > 0
                        ? `A próxima dica libera em ${dicaCooldown} filme(s)`
                        : 'Liberada após 5 palpites'
                    }
                  >
                    {loadingDica
                      ? 'Buscando...'
                      : dicaCooldown > 0
                        ? `💡 Dica (${dicaCooldown})`
                        : '💡 Dica'}
                  </button>
                </div>
              </>
            )}

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
                      const status =
                        col.key === 'nome'
                          ? (normalizeId(attempt._movieId ?? attempt.id) === normalizeId(targetData?.id) ? 'correct' : 'wrong')
                          : compareCell(col.key, attempt[col.key], targetData?.[col.key])

                      const displayVal =
                        col.key === 'ano'
                          ? `${attempt[col.key]}${yearArrow(attempt[col.key], targetData?.ano)}`
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
                      O filme era <strong>{targetData?.nome ?? 'desconhecido'}</strong> — acertou em {attempts.length} tentativa{attempts.length !== 1 ? 's' : ''}!
                      {streak > 1 && <> Sequência: <strong style={{ color: 'var(--gold)' }}>{streak} 🔥</strong></>}
                    </>
                  ) : (
                    <>
                      O filme era <strong>{targetData?.nome ?? 'desconhecido'}</strong>. Sequência perdida.
                    </>
                  )}
                </div>

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