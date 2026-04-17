import type { MoodTag } from './mood'

export const GENRES = ['pop', 'rock', 'classical', 'lofi', 'jazz', 'edm', 'hiphop'] as const
export type Genre = (typeof GENRES)[number]

export type MoodGenreMap = Record<MoodTag, Genre>

const LS = {
  username: 'username',
  genre: 'genre',
  mode: 'mode',
  mood: 'mood',
  moodGenres: 'moodGenres',
} as const

export function getUsername() {
  return localStorage.getItem(LS.username) || 'User'
}

export function setUsername(username: string) {
  localStorage.setItem(LS.username, username)
}

export function getBaseGenre(): Genre {
  return (localStorage.getItem(LS.genre) as Genre) || 'pop'
}

export function setBaseGenre(genre: Genre) {
  localStorage.setItem(LS.genre, genre)
}

export function getMode(): 'on' | 'off' {
  return (localStorage.getItem(LS.mode) as 'on' | 'off') || 'on'
}

export function setMode(mode: 'on' | 'off') {
  localStorage.setItem(LS.mode, mode)
}

export function getManualMood(): MoodTag {
  return (localStorage.getItem(LS.mood) as MoodTag) || 'happy'
}

export function setManualMood(mood: MoodTag) {
  localStorage.setItem(LS.mood, mood)
}

export function getMoodGenres(): MoodGenreMap {
  const base = getBaseGenre()
  const fallback: MoodGenreMap = {
    happy: base,
    sad: base,
    relaxed: base,
    energetic: base,
    chill: base,
    angry: base,
  }

  const raw = localStorage.getItem(LS.moodGenres)
  if (!raw) return fallback
  try {
    const parsed = JSON.parse(raw) as Partial<MoodGenreMap>
    return { ...fallback, ...parsed }
  } catch {
    return fallback
  }
}

export function setMoodGenres(map: MoodGenreMap) {
  localStorage.setItem(LS.moodGenres, JSON.stringify(map))
}

