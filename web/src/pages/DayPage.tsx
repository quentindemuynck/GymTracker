import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { ExerciseCard } from '../components/ExerciseCard'
import { ExerciseForm } from '../components/ExerciseForm'
import type { Day } from '../types'

export function DayPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [day, setDay] = useState<Day | null>(null)
  const [loading, setLoading] = useState(true)
  const [logging, setLogging] = useState(false)
  const [justLogged, setJustLogged] = useState(false)
  const [addingExercise, setAddingExercise] = useState(false)

  function refresh() {
    return api.get<Day>(`/days/${id}`).then(setDay)
  }

  useEffect(() => {
    setLoading(true)
    refresh().finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function finishDay() {
    if (!day) return
    setLogging(true)
    try {
      await api.post('/sessions', { dayId: day.id })
      setJustLogged(true)
    } finally {
      setLogging(false)
    }
  }

  if (loading) return <div className="page-loading">Loading…</div>
  if (!day) return <div className="page">Day not found.</div>

  return (
    <div className="page">
      <Link to="/" className="back-link">
        ← Back
      </Link>
      <div className="day-header">
        <span className="day-header-emoji">{day.emoji}</span>
        <div>
          <h1>{day.name}</h1>
          {day.subtitle && <p className="muted">{day.subtitle}</p>}
        </div>
      </div>

      <div className="exercise-list">
        {day.exercises.map((ex) => (
          <ExerciseCard key={ex.id} exercise={ex} onUpdated={refresh} onDeleted={refresh} />
        ))}
      </div>

      <div className="add-exercise-section">
        {addingExercise ? (
          <ExerciseForm
            submitLabel="Add exercise"
            onCancel={() => setAddingExercise(false)}
            onSave={async (payload) => {
              await api.post(`/days/${day.id}/exercises`, payload)
              setAddingExercise(false)
              refresh()
            }}
          />
        ) : (
          <button className="link-btn add-exercise-btn" onClick={() => setAddingExercise(true)}>
            + Add exercise
          </button>
        )}
      </div>

      <button className="primary finish-btn" onClick={finishDay} disabled={logging || justLogged}>
        {justLogged ? '✓ Logged in your tracker' : logging ? 'Saving…' : `Mark ${day.name} done today`}
      </button>
      {justLogged && (
        <button className="link-btn" onClick={() => navigate('/tracker')}>
          View tracker →
        </button>
      )}
    </div>
  )
}
