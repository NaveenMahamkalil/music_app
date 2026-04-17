import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import type { MoodTag } from '../lib/mood'
import {
  GENRES,
  getBaseGenre,
  getMoodGenres,
  setBaseGenre,
  setMoodGenres,
  type Genre,
  type MoodGenreMap,
} from '../lib/prefs'
import { useAuth } from '../state/AuthContext'

const MOOD_LABELS: Record<MoodTag, string> = {
  happy: 'Happy',
  sad: 'Sad',
  relaxed: 'Relaxed',
  energetic: 'Energetic',
  chill: 'Chill',
  angry: 'Angry',
}

export default function Settings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [genre, setGenre] = useState<Genre>(getBaseGenre())
  const [moodGenres, setMoodGenresState] = useState<MoodGenreMap>(getMoodGenres())

  const isAuthed = useMemo(() => Boolean(user), [user])
  if (!isAuthed) return <Navigate to="/login" replace />

  function onSave(e: React.FormEvent) {
    e.preventDefault()
    setBaseGenre(genre)
    setMoodGenres(moodGenres)

    const token = localStorage.getItem('token')
    if (token) {
      fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          baseGenre: genre,
          moodGenres,
          mode: localStorage.getItem('mode') || 'on',
          mood: localStorage.getItem('mood') || 'happy',
        }),
      }).catch(() => {
        // local fallback only
      })
    }

    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="page">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <h1 className="title" style={{ margin: 0 }}>
            Preferences
          </h1>
          <Link to="/dashboard" className="muted">
            Back
          </Link>
        </div>
        <p className="subtitle">Change your genre preferences anytime.</p>

        <form onSubmit={onSave} className="form">
          <label className="field">
            <span>Base genre</span>
            <select value={genre} onChange={(e) => setGenre(e.target.value as Genre)}>
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g[0].toUpperCase() + g.slice(1)}
                </option>
              ))}
            </select>
          </label>

          <div className="divider" />
          <div className="muted" style={{ fontSize: 13 }}>
            For each mood, choose the genre to play:
          </div>

          {(Object.keys(moodGenres) as MoodTag[]).map((m) => (
            <label key={m} className="field">
              <span>{MOOD_LABELS[m]}</span>
              <select
                value={moodGenres[m]}
                onChange={(e) => setMoodGenresState({ ...moodGenres, [m]: e.target.value as Genre })}
              >
                {GENRES.map((g) => (
                  <option key={g} value={g}>
                    {g[0].toUpperCase() + g.slice(1)}
                  </option>
                ))}
              </select>
            </label>
          ))}

          <button className="btn primary" type="submit">
            Save
          </button>
        </form>
      </div>
    </div>
  )
}

