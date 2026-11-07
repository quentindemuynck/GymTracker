import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { ExerciseCard } from '../components/ExerciseCard'
import { ExerciseForm } from '../components/ExerciseForm'
import type { Day } from '../types'

export function DayPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [day, setDay] = useState<Day | null>(null)
  const [myDays, setMyDays] = useState<Day[]>([])
  const [loading, setLoading] = useState(true)
  const [logging, setLogging] = useState(false)
  const [justLogged, setJustLogged] = useState(false)
  const [addingExercise, setAddingExercise] = useState(false)
  const [copyingDay, setCopyingDay] = useState(false)

  function refresh() {
    return api.get<Day>(`/days/${id}`).then(setDay)
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([refresh(), api.get<Day[]>('/days').then(setMyDays)]).finally(() => setLoading(false))
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

  async function copyDay() {
    if (!day) return
    setCopyingDay(true)
    try {
      const copy = await api.post<Day>(`/days/${day.id}/copy`)
      navigate(`/day/${copy.id}`)
    } finally {
      setCopyingDay(false)
    }
  }

  if (loading) return <div className="page-loading">Loading…</div>
  if (!day) return <div className="page">Day not found.</div>

  const owned = day.user_id === user?.id

  return (
    <div className="page">
      <Link to="/" className="back-link">
        ← Back
      </Link>
      <div className="day-header">
        <span className="day-header-emoji">{day.emoji}</span>
        <div className="grow">
          <h1>{day.name}</h1>
          {day.subtitle && <p className="muted">{day.subtitle}</p>}
          {!owned && (
            <p className="muted small">
              {day.user_id === null ? (
                'Template'
              ) : (
                <>
                  <span className="dot" style={{ background: day.owner_color ?? undefined }} />{' '}
                  {day.owner_display_name}'s day
                </>
              )}
            </p>
          )}
        </div>
        {!owned && (
          <button className="primary small" onClick={copyDay} disabled={copyingDay}>
            {copyingDay ? 'Copying…' : 'Copy this day to my split'}
          </button>
        )}
      </div>

      <div className="exercise-list">
        {day.exercises.map((ex) => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            owned={owned}
            myDays={myDays}
            onUpdated={refresh}
            onDeleted={refresh}
          />
        ))}
      </div>

      {owned && (
        <>
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
        </>
      )}
    </div>
  )
}
