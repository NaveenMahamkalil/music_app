import type { MoodTag } from '../lib/mood'

const MOODS: { value: MoodTag; label: string }[] = [
  { value: 'happy', label: 'Happy' },
  { value: 'sad', label: 'Sad' },
  { value: 'relaxed', label: 'Relaxed' },
  { value: 'energetic', label: 'Energetic' },
  { value: 'angry', label: 'Angry' },
]

export default function MoodToggleButtons({
  value,
  onChange,
}: {
  value: MoodTag
  onChange: (m: MoodTag) => void
}) {
  return (
    <div className="segmented" role="group" aria-label="Mood">
      {MOODS.map((m) => (
        <button
          key={m.value}
          type="button"
          className={`segBtn ${value === m.value ? 'active' : ''}`}
          onClick={() => onChange(m.value)}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}

