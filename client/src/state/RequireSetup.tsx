import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

function hasPrefs() {
  const genre = localStorage.getItem('genre')
  const moodGenres = localStorage.getItem('moodGenres')
  return Boolean(genre && moodGenres)
}

export function RequireSetup({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (user?.setupComplete === false) return <Navigate to="/setup" replace />
  if (!hasPrefs()) return <Navigate to="/setup" replace />
  return <>{children}</>
}

