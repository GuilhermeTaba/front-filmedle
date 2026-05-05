import React, { useMemo } from 'react'
import './CinemaBackground.css'

const TMDB = 'https://image.tmdb.org/t/p/w342'

const POSTER_POOL = [
  '/3bhkrj58Vtu7enYsLegHnDcdh9b.jpg',
  '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
  '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
  '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
  '/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
  '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  '/7IiTTglonog5LkmuQMXYORRYgqA.jpg',
  '/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
  '/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg',
  '/rSPw7tgCH9c6NqICZef4kZjFOQ5.jpg',
]

const ZONES = [
  // cantos superiores
  { top: '6%',    left: '4%'   },
  { top: '6%',    right: '4%'  },
  // interior superior
  { top: '6%',    left: '20%'  },
  { top: '6%',    right: '20%' },
  // laterais centrais
  { top: '38%',   left: '4%'   },
  { top: '38%',   right: '4%'  },
  // cantos inferiores
  { bottom: '5%', left: '4%'   },
  { bottom: '5%', right: '4%'  },
  // interior inferior
  { bottom: '5%', left: '20%'  },
  { bottom: '5%', right: '20%' },
]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function CinemaBackground() {
  const posters = useMemo(() => {
    const paths = shuffle(POSTER_POOL).slice(0, 6)
    const zones = shuffle(ZONES).slice(0, 6)
    return paths.map((path, i) => ({
      url:      `${TMDB}${path}`,
      position: zones[i],
      rotation: (Math.random() - 0.5) * 20,
      delay:    -(Math.random() * 10),
      duration: 7 + Math.random() * 4,
    }))
  }, [])

  return (
    <div className="cb-root" aria-hidden="true">
      <div className="cb-gradients" />
      <div className="cb-posters">
        {posters.map((p, i) => (
          <div
            key={i}
            className="cb-poster"
            style={{
              ...p.position,
              backgroundImage: `url(${p.url})`,
              transform: `rotate(${p.rotation}deg)`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>
      <div className="cb-vignette" />
      <div className="cb-noise" />
    </div>
  )
}
