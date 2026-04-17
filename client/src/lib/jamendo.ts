export const JAMENDO_BASE = 'https://api.jamendo.com/v3.0/tracks/'
export const JAMENDO_CLIENT_ID = 'ac5ee77d'

export type JamendoTrack = {
  id: string
  name: string
  artist_name: string
  album_name?: string
  album_image?: string
  image?: string
  audio: string
}

type JamendoResponse = {
  results?: JamendoTrack[]
}

export async function fetchTracks(params: { tags?: string; limit?: number }) {
  const limit = params.limit ?? 10
  const tags = params.tags?.trim()
  const tagsParam = tags ? encodeURIComponent(tags) : ''
  const url =
    tags
      ? `${JAMENDO_BASE}?client_id=${JAMENDO_CLIENT_ID}&tags=${tagsParam}&limit=${limit}`
      : `${JAMENDO_BASE}?client_id=${JAMENDO_CLIENT_ID}&limit=${limit}`

  const res = await fetch(url)
  if (!res.ok) throw new Error('jamendo_failed')
  const data = (await res.json()) as JamendoResponse
  return data.results ?? []
}

