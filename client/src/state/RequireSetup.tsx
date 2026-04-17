import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

function hasPrefs() {
  const genre = localStorage.getItem('genre')
  const moodGenres = localStorage.getItem('moodGenres')
  return Boolean(genre && moodGenres)
}

export function RequireSetup({ children }: { children: ReactNode }) {
  if (!hasPrefs()) return <Navigate to="/setup" replace />
  return <>{children}</>
}

