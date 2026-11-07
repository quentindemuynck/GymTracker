export interface User {
  id: number
  username: string
  displayName: string
  color: string
}

export interface ExerciseLog {
  id: number
  exercise_id: number
  user_id: number
  date: string
  weight: number | null
  weight_unit: string
  sets: number | null
  reps: string | null
  note: string | null
  display_name?: string
  color?: string
}

export interface ExerciseNote {
  id: number
  exercise_id: number
  user_id: number
  note: string
  updated_at: string
  display_name?: string
  color?: string
}

export interface Exercise {
  id: number
  day_id: number
  name: string
  target_sets: number | null
  target_reps: string | null
  default_weight: number | null
  weight_unit: string
  cue: string | null
  exercise_order: number
  video_url: string | null
}

export interface Day {
  id: number
  name: string
  subtitle: string | null
  emoji: string
  weekday: string | null
  day_order: number
  exercises: Exercise[]
}

export interface Session {
  id: number
  user_id: number
  day_id: number | null
  date: string
  note: string | null
  display_name?: string
  color?: string
  day_name?: string
  day_emoji?: string
}

export interface Quote {
  id: number
  text: string
  author: string | null
}

export interface Stats {
  streak: number
  totalSessions: number
  thisWeek: number
}
