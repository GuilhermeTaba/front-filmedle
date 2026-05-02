import React, { useState, useRef, useEffect } from 'react'
import './ModoDiario.css'

// ─────────────────────────────────────────────────────────────────
// MOCK DATA — substitua pela chamada real à sua API
// ─────────────────────────────────────────────────────────────────

/** Lista de filmes disponíveis para busca.
 *  Substitua por: const res = await fetch('/api/movies'); const MOVIES = await res.json()
 */
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

/** Objeto de resposta que virá da sua API ao tentar um filme.
 *
 *  Substitua `fetchGuessResult` pela sua lógica de integração.
 *
 *  Formato esperado da API:
 *  {
 *    nome:      string
 *    genero:    string
 *    pais:      string
 *    ano:       number
 *    receita:   string   (ex: "US$ 1,2 bi")
 *    produtora: string
 *    elenco:    string   (principais nomes separados por vírgula)
 *    diretor:   string
 *  }
 */
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

/** Filme do dia (mockado). Em produção, busque via API:
 *  const res = await fetch('/api/daily'); const { dailyMovieId } = await res.json()
 */
const DAILY_MOVIE_ID = 4  // Interestelar

const MAX_ATTEMPTS = 6

// ─────────────────────────────────────────────────────────────────
// API INTEGRATION HOOK — altere apenas esta função
// ─────────────────────────────────────────────────────────────────

/**
 * Busca o resultado de uma tentativa na API.
 * @param {number} movieId - ID do filme tentado
 * @returns {Promise<Object>} - objeto com os atributos do filme
 *
 * Para integrar com sua API, substitua o corpo desta função por:
 *   const res = await fetch(`/api/guess?movieId=${movieId}&daily=${DAILY_MOVIE_ID}`)
 *   return res.json()
 *
 * A API deve retornar o objeto do filme com os atributos:
 * { nome, genero, pais, ano, receita, produtora, elenco, diretor }
 */
async function fetchGuessResult(movieId) {
  // MOCK: simula latência de rede
  await new Promise(r => setTimeout(r, 300))
  const data = MOCK_MOVIES_DATA[movieId]
  if (!data) throw new Error('Filme não encontrado')
  return data
}

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

const TARGET = MOCK_MOVIES_DATA[DAILY_MOVIE_ID]

function compareCell(field, value) {
  const target = TARGET[field]
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

function yearArrow(guessedYear) {
  if (guessedYear === TARGET.ano) return ''
  return guessedYear < TARGET.ano ? ' ↑' : ' ↓'
}

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

// ─────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────

/**
 * Props:
 *  bgSrc   — caminho da imagem de fundo  (ex: "/img/imagem_fundo_filmedle.jpg")
 *  logoSrc — caminho da logo              (ex: "/img/filmedle.png")
 *
 * Se não passar nenhuma das duas, o componente usa fundo escuro sólido
 * e exibe o texto "FILMEDLE" como fallback.
 */


export default function ModoDiario() {
  const [query, setQuery]         = useState('')
  const [selected, setSelected]   = useState(null)   // { id, nome }
  const [showDrop, setShowDrop]   = useState(false)
  const [attempts, setAttempts]   = useState([])     // array of movie objects
  const [loading, setLoading]     = useState(false)
  const [gameOver, setGameOver]   = useState(false)  // true when won or lost
  const [won, setWon]             = useState(false)
  const inputRef = useRef(null)
  const dropRef  = useRef(null)
  const bgSrc = "/img/imagem_fundo_filmedle.jpg"
  const logoSrc = "/img/filmedle.png"

  const guessedIds = attempts.map(a => a._movieId)

  const filtered = MOVIES_LIST.filter(m =>
    m.nome.toLowerCase().includes(query.toLowerCase()) &&
    !guessedIds.includes(m.id)
  )

  // close dropdown on outside click
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

  function handleSelect(movie) {
    setSelected(movie)
    setQuery(movie.nome)
    setShowDrop(false)
  }

  async function handleGuess() {
    if (!selected || loading || gameOver) return
    setLoading(true)
    try {
      const result = await fetchGuessResult(selected.id)
      const enriched = { ...result, _movieId: selected.id }
      const newAttempts = [enriched, ...attempts]
      setAttempts(newAttempts)

      if (selected.id === DAILY_MOVIE_ID) {
        setWon(true)
        setGameOver(true)
      } else if (newAttempts.length >= MAX_ATTEMPTS) {
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

  function handleReset() {
    setAttempts([])
    setSelected(null)
    setQuery('')
    setGameOver(false)
    setWon(false)
  }

  const remainingAttempts = MAX_ATTEMPTS - attempts.length

  return (
    <div className="fd-page">

      {/* ── Background image ── */}
      {bgSrc && <img src={bgSrc} alt="" className="fd-bg" />}
      {bgSrc && <div className="fd-overlay" />}

      <div className="fd-container">

        {/* ── HEADER ── */}
        <header className="fd-header">
          {logoSrc
            ? <img src={logoSrc} alt="Filmedle" className="fd-logo-img" />
            : <h1 className="fd-logo">Filmedle</h1>
          }
          <span className="fd-mode-tag">Modo Diário</span>
        </header>

        {/* ── CLUE / DESCRIPTION ── */}
        <div className="fd-clue-box">
          <div className="fd-clue-label">Dica do Dia</div>
          <div className="fd-clue-text">
            Adivinhe o filme de hoje! Você tem <strong style={{ color: 'var(--red-bright)' }}>{MAX_ATTEMPTS} tentativas</strong>.
            Campos em <span style={{ color: 'var(--green)' }}>verde</span> indicam acerto,&nbsp;
            <span style={{ color: 'var(--gold)' }}>amarelo</span> indica proximidade
            e <span style={{ color: '#f88' }}>vermelho</span> indica erro.
          </div>
        </div>

        {/* ── ATTEMPTS COUNTER ── */}
        <div className="fd-attempts-counter">
          Tentativas restantes: <span>{Math.max(0, remainingAttempts)}</span> / {MAX_ATTEMPTS}
        </div>

        {/* ── SEARCH ── */}
        {!gameOver && (
          <>
            <div className="fd-search-wrapper">
              <input
                ref={inputRef}
                className="fd-search-input"
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
              <span className="fd-search-icon">⌕</span>

              {showDrop && query.length > 0 && (
                <div className="fd-dropdown" ref={dropRef}>
                  {filtered.length === 0 ? (
                    <div className="fd-dropdown-empty">Nenhum filme encontrado</div>
                  ) : (
                    filtered.map(m => (
                      <div
                        key={m.id}
                        className="fd-dropdown-item"
                        onMouseDown={() => handleSelect(m)}
                      >
                        <span className="fd-item-id">#{m.id}</span>
                        {m.nome}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <button
              className="fd-btn-guess"
              onClick={handleGuess}
              disabled={!selected || loading}
            >
              {loading ? 'Verificando...' : (
                <>
                  <span>▶</span>
                  Confirmar Tentativa
                  <span className="fd-btn-arrow">→</span>
                </>
              )}
            </button>
          </>
        )}

        {/* ── ATTEMPTS TABLE ── */}
        {attempts.length > 0 && (
          <section className="fd-attempts-section">
            <div className="fd-section-title">Tentativas</div>

            {/* column headers */}
            <div className="fd-col-headers">
              {COLUMNS.map(c => (
                <div key={c.key} className="fd-col-header">{c.label}</div>
              ))}
            </div>

            {/* attempt rows */}
            {attempts.map((attempt, i) => (
              <div
                key={i}
                className="fd-attempt-card"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                {COLUMNS.map(col => {
                  const status = col.key === 'nome'
                    ? (attempt._movieId === DAILY_MOVIE_ID ? 'correct' : 'wrong')
                    : compareCell(col.key, attempt[col.key])

                  const displayVal = col.key === 'ano'
                    ? `${attempt[col.key]}${yearArrow(attempt[col.key])}`
                    : attempt[col.key]

                  return (
                    <div key={col.key} className={`fd-cell ${status}`}>
                      {displayVal}
                    </div>
                  )
                })}
              </div>
            ))}
          </section>
        )}

        {/* ── RESULT BANNER ── */}
        {gameOver && (
          <div className={`fd-result-banner ${won ? 'win' : 'lose'}`}>
            <div className="fd-result-emoji">{won ? '🎬' : '💀'}</div>
            <div className={`fd-result-title ${won ? 'win' : 'lose'}`}>
              {won ? 'Você Acertou!' : 'Game Over'}
            </div>
            <div className="fd-result-sub">
              {won
                ? <>O filme era <strong>{TARGET.nome}</strong> — acertou em {attempts.length} tentativa{attempts.length !== 1 ? 's' : ''}!</>
                : <>O filme era <strong>{TARGET.nome}</strong>. Tente novamente amanhã!</>
              }
            </div>
            <button className="fd-btn-reset" onClick={handleReset}>
              Jogar Novamente (Dev)
            </button>
          </div>
        )}

      </div>
    </div>
  )
}