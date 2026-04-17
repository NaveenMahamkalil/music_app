export type MoodTag = 'happy' | 'sad' | 'relaxed' | 'energetic' | 'chill' | 'angry'

export const MANUAL_MOODS: { value: MoodTag; label: string }[] = [
  { value: 'happy', label: 'Happy' },
  { value: 'sad', label: 'Sad' },
  { value: 'relaxed', label: 'Relaxed' },
  { value: 'energetic', label: 'Energetic' },
  { value: 'angry', label: 'Angry' },
]

export function mapExpressionToMoodTag(expression: string): MoodTag {
  switch (expression) {
    case 'happy':
      return 'happy'
    case 'sad':
      return 'sad'
    case 'angry':
      return 'energetic'
    case 'surprised':
      return 'energetic'
    case 'neutral':
      return 'chill'
    case 'fearful':
      return 'sad'
    case 'disgusted':
      return 'sad'
    default:
      return 'happy'
  }
}

