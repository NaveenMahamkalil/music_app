import { type RefObject } from 'react'
import type { JamendoTrack } from '../lib/jamendo'

export default function SongCard({
  song,
  isFirst = false,
  audioRef,
}: {
  song: JamendoTrack
  isFirst?: boolean
  audioRef?: RefObject<HTMLAudioElement>
}) {
  const img = song.album_image || song.image

  return (
    <div className="songCard">
      <div className="songMeta">
        <div className="coverWrap">
          {img ? <img className="cover" src={img} alt={song.name} /> : <div className="cover placeholder" />}
        </div>
        <div>
          <div className="songTitle">{song.name}</div>
          <div className="songArtist">{song.artist_name}</div>
        </div>
      </div>
      <audio
        controls
        src={song.audio}
        className="audio"
        autoPlay={isFirst}
        ref={audioRef}
      />
    </div>
  )
}

