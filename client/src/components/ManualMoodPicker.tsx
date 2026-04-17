import { useState } from 'react'
import { MANUAL_MOODS, type MoodTag } from '../lib/mood'

export default function ManualMoodPicker({
  initial,
  onSet,
}: {
  initial: MoodTag
  onSet: (mood: MoodTag) => void
}) {
  const [mood, setMood] = useState<MoodTag>(initial)

  function setManualMood() {
    localStorage.setItem('mood', mood)
    onSet(mood)
  }

  return (
    <div className="manualRow">
      <select value={mood} onChange={(e) => setMood(e.target.value as MoodTag)} className="select">
        {MANUAL_MOODS.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
      <button type="button" className="btn" onClick={setManualMood}>
        Set Mood
      </button>
    </div>
  )
}

