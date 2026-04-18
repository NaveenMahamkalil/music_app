import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'
import {
  GENRES,
  getBaseGenre,
  getMoodGenres,
  setBaseGenre,
  setMoodGenres,
  setMode,
  setUsername,
  type Genre,
} from '../lib/prefs'

export default function Setup() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()

  if (!user) return <Navigate to="/login" replace />
  const userName = user.name

  const existingGenre = getBaseGenre()
  const existingMoodGenres = getMoodGenres()

  const [genre, setGenre] = useState<Genre>(existingGenre)
  const [moodGenres, setMoodGenresState] = useState(existingMoodGenres)

  if (user.setupComplete !== false) {
    const isDone = Boolean(localStorage.getItem('genre') && localStorage.getItem('moodGenres'))
    if (isDone) return <Navigate to="/dashboard" replace />
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setUsername(userName)
    setBaseGenre(genre)
    setMoodGenres(moodGenres)
    setMode('on')
    if (!localStorage.getItem('mood')) localStorage.setItem('mood', 'happy')

    const token = localStorage.getItem('token')
    if (token) {
      try {
        const res = await fetch('/api/user/preferences', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            baseGenre: genre,
            moodGenres,
            mode: 'on',
            mood: localStorage.getItem('mood') || 'happy',
          }),
        })
        if (!res.ok) {
          // keep local prefs; user can retry from settings
        }
      } catch {
        // network error — local prefs still saved above
      }
    }

    await refreshUser()
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="page">
      <div className="card">
        <h1 className="title">First-time setup</h1>
        <p className="subtitle">Choose your base genre, and what to play for each mood.</p>

        <form onSubmit={onSubmit} className="form">
          <label className="field">
            <span>Preferred music genre</span>
            <select value={genre} onChange={(e) => setGenre(e.target.value as Genre)} required>
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g[0].toUpperCase() + g.slice(1)}
                </option>
              ))}
            </select>
          </label>

          <div className="divider" />
          <div className="muted" style={{ fontSize: 13 }}>
            For each mood, select what kind of songs should be played:
          </div>

          <label className="field">
            <span>Happy</span>
            <select
              value={moodGenres.happy}
              onChange={(e) => setMoodGenresState({ ...moodGenres, happy: e.target.value as Genre })}
            >
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g[0].toUpperCase() + g.slice(1)}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Sad</span>
            <select
              value={moodGenres.sad}
              onChange={(e) => setMoodGenresState({ ...moodGenres, sad: e.target.value as Genre })}
            >
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g[0].toUpperCase() + g.slice(1)}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Relaxed</span>
            <select
              value={moodGenres.relaxed}
              onChange={(e) => setMoodGenresState({ ...moodGenres, relaxed: e.target.value as Genre })}
            >
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g[0].toUpperCase() + g.slice(1)}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Energetic</span>
            <select
              value={moodGenres.energetic}
              onChange={(e) => setMoodGenresState({ ...moodGenres, energetic: e.target.value as Genre })}
            >
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g[0].toUpperCase() + g.slice(1)}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Angry</span>
            <select
              value={moodGenres.angry}
              onChange={(e) => setMoodGenresState({ ...moodGenres, angry: e.target.value as Genre })}
            >
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g[0].toUpperCase() + g.slice(1)}
                </option>
              ))}
            </select>
          </label>

          <button className="btn primary">Continue</button>
        </form>
      </div>
    </div>
  )
}

