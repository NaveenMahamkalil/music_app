import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type User = { id: string; name: string; email: string; setupComplete?: boolean }

type AuthContextValue = {
  user: User | null
  token: string | null
  isLoading: boolean
  signup: (params: { name: string; email: string; password: string }) => Promise<void>
  login: (params: { email: string; password: string }) => Promise<void>
  refreshUser: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const LS_TOKEN = 'token'
const LS_USER = 'user'
const LS_IS_LOGGED_IN = 'isLoggedIn'

async function syncPreferencesFromServer(token: string) {
  try {
    const res = await fetch('/api/user/preferences', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return

    const data = await res.json()
    const prefs = data.preferences || {}

    if (prefs.baseGenre) localStorage.setItem('genre', prefs.baseGenre)
    if (prefs.mode) localStorage.setItem('mode', prefs.mode)
    if (prefs.mood) localStorage.setItem('mood', prefs.mood)
    if (prefs.moodGenres) localStorage.setItem('moodGenres', JSON.stringify(prefs.moodGenres))
  } catch {
    // ignore sync error and keep local fallback
  }
}

function setSession(token: string, user: User) {
  localStorage.setItem(LS_TOKEN, token)
  localStorage.setItem(LS_USER, JSON.stringify(user))
  localStorage.setItem(LS_IS_LOGGED_IN, 'true')
}

function clearSession() {
  localStorage.clear()
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem(LS_TOKEN)
    if (!t) {
      setIsLoading(false)
      return
    }
    setToken(t)

    ;(async () => {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${t}` },
        })
        if (!res.ok) throw new Error('unauthorized')
        const data = (await res.json()) as { user: User }
        setUser(data.user)
        localStorage.setItem(LS_USER, JSON.stringify(data.user))
        localStorage.setItem(LS_IS_LOGGED_IN, 'true')
        await syncPreferencesFromServer(t)
      } catch {
        clearSession()
        setUser(null)
        setToken(null)
      } finally {
        setIsLoading(false)
      }
    })()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      async refreshUser() {
        const t = localStorage.getItem(LS_TOKEN)
        if (!t) return
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${t}` },
        })
        if (!res.ok) return
        const data = (await res.json()) as { user: User }
        setUser(data.user)
        localStorage.setItem(LS_USER, JSON.stringify(data.user))
      },
      async signup({ name, email, password }) {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || 'signup_failed')
        setSession(data.token, data.user)
        setToken(data.token)
        setUser(data.user)
        await syncPreferencesFromServer(data.token)
      },
      async login({ email, password }) {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || 'login_failed')
        setSession(data.token, data.user)
        setToken(data.token)
        setUser(data.user)
        await syncPreferencesFromServer(data.token)
      },
      logout() {
        clearSession()
        setUser(null)
        setToken(null)
      },
    }),
    [user, token, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

