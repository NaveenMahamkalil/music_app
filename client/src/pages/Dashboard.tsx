import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MoodCamera from '../components/MoodCamera'
import SongCard from '../components/SongCard'
import { fetchTracks, type JamendoTrack } from '../lib/jamendo'
import type { MoodTag } from '../lib/mood'
import { getBaseGenre, getMode, getMoodGenres, getManualMood, getUsername, setMode } from '../lib/prefs'
import { useAuth } from '../state/AuthContext'

type MoodDecision =
  | { kind: 'ok'; mood: MoodTag; expression: string; confidence: number }
  | { kind: 'uncertain'; expression: string | null; confidence: number }

export default function Dashboard() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const username = getUsername()
  const baseGenre = getBaseGenre()
  const moodGenres = getMoodGenres()

  const [mode, setModeState] = useState<'on' | 'off'>(getMode())
  const [decision, setDecision] = useState<MoodDecision>({ kind: 'uncertain', expression: null, confidence: 0 })
  const [detectedMood, setDetectedMood] = useState<MoodTag>(getManualMood())
  const [finalMood, setFinalMood] = useState<MoodTag | null>(null)
  const [forceRandom, setForceRandom] = useState(false)
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(mode === 'off')

  const [songs, setSongs] = useState<JamendoTrack[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const effectiveMood: MoodTag = useMemo(() => {
    if (mode !== 'on') return detectedMood
    if (decision.kind === 'ok') return decision.mood
    return detectedMood
  }, [mode, decision, detectedMood])

  const effectiveGenre = useMemo(() => {
    return moodGenres[effectiveMood] || baseGenre
  }, [moodGenres, effectiveMood, baseGenre])

  const moodLabel = useMemo(() => {
    if (mode !== 'on') return `${detectedMood} (normal)`
    if (decision.kind === 'ok') return `${decision.mood} (AI)`
    if (finalMood) return `${finalMood} (final)`
    return `Detecting...`
  }, [mode, decision, detectedMood, finalMood])

  function toggleMode() {
    const next = mode === 'on' ? 'off' : 'on'
    setMode(next)
    setModeState(next)
    setForceRandom(next === 'off')
    setAutoPlayEnabled(next === 'off')
    if (next === 'on') {
      setFinalMood(null)
      setDecision({ kind: 'uncertain', expression: null, confidence: 0 })
    }
  }

  function onLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const firstAudioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      setError(null)
      setIsLoading(true)
      try {
        if (mode === 'on' && decision.kind !== 'ok') {
          // Strict mode: wait for final AI mood before fetching recommendation list
          if (!cancelled) setSongs([])
          return
        }

        const tags = forceRandom ? undefined : `${effectiveMood}+${effectiveGenre}`
        const tracks = await fetchTracks({ tags, limit: 10 })
        if (!cancelled) setSongs(tracks)
      } catch (e: any) {
        if (!cancelled) setError(String(e?.message || 'Failed to load songs'))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [mode, effectiveMood, effectiveGenre, forceRandom, decision])

  useEffect(() => {
    if (!autoPlayEnabled || songs.length === 0) return

    const firstAudio = firstAudioRef.current
    if (firstAudio) {
      firstAudio
        .play()
        .catch(() => {
          // Autoplay blocked by browser policy; user can click play manually
        })
    }
  }, [songs, autoPlayEnabled])

  return (
    <div className="dashboard">
      <header className="topbar">
        <div>
          <div className="topTitle">AI Mood-Based Music Player</div>
          <div className="muted">
            Welcome, {username} • Mood: {effectiveMood} • Genre: {effectiveGenre}
          </div>
        </div>
        <div className="topActions">
          <button className="btn" onClick={toggleMode} type="button">
            {mode === 'on' ? 'Mode: ON (AI)' : 'Mode: OFF (Normal)'}
          </button>
          <Link className="btn" to="/settings">
            Preferences
          </Link>
          <button className="btn" type="button" onClick={() => setForceRandom(true)}>
            Random
          </button>
          <button className="btn danger" onClick={onLogout} type="button">
            Logout
          </button>
        </div>
      </header>

      <main className="content">
        <div className="grid">
          <section className="panel">
            <div className="panelHeader">
              <div className="sectionTitle">Mood</div>
              <div className="pill">{moodLabel}</div>
            </div>

            {mode === 'on' ? (
              <>
                {decision.kind === 'ok' ? (
                  <div className="note">Final mood detected: {decision.mood} ({decision.confidence.toFixed(2)})</div>
                ) : (
                  <MoodCamera
                    onDecision={(d) => {
                      setDecision(d)
                      if (d.kind === 'ok') {
                        setDetectedMood(d.mood)
                        setFinalMood(d.mood)
                        setAutoPlayEnabled(true)
                        localStorage.setItem('mood', d.mood)
                        setForceRandom(false)
                      }
                    }}
                  />
                )}

                {decision.kind === 'uncertain' ? (
                  <div className="note">
                    Low confidence ({decision.confidence.toFixed(2)}), waiting for stable final mood.
                  </div>
                ) : null}
              </>
            ) : (
              <div className="note">AI mode is OFF. Using manual mood-based recommendations.</div>
            )}
          </section>

          <section className="panel">
            <div className="panelHeader">
              <div className="sectionTitle">Recommended songs</div>
              <div className="muted">{isLoading ? 'Loading…' : `${songs.length} tracks`}</div>
            </div>

            {error ? <div className="error">{error}</div> : null}

            <div className="songs">
              {songs.map((s, index) => (
                <SongCard
                  key={s.id}
                  song={s}
                  isFirst={index === 0}
                  audioRef={index === 0 ? firstAudioRef : undefined}
                />
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

