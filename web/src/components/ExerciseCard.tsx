import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { ExerciseForm, type ExerciseFormValues } from './ExerciseForm'
import { cleanDecimalInput, parseDecimal } from '../lib/decimal'
import type { Day, Exercise, ExerciseLog } from '../types'

export function ExerciseCard({
  exercise,
  owned,
  myDays,
  onUpdated,
  onDeleted,
}: {
  exercise: Exercise
  /** Does the current user own the day this exercise lives in? */
  owned: boolean
  /** The current user's own days, used as copy targets when `owned` is false. */
  myDays?: Day[]
  onUpdated?: () => void
  onDeleted?: () => void
}) {
  const { user } = useAuth()
  const [logs, setLogs] = useState<ExerciseLog[]>([])
  const [expanded, setExpanded] = useState(false)
  const [editingExercise, setEditingExercise] = useState(false)
  const [weight, setWeight] = useState('')
  const [sets, setSets] = useState('')
  const [reps, setReps] = useState('')
  const [logNote, setLogNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [copyTarget, setCopyTarget] = useState('')
  const [copyState, setCopyState] = useState<'idle' | 'copying' | 'done'>('idle')

  function refresh() {
    api.get<ExerciseLog[]>(`/exercises/${exercise.id}/logs?limit=8`).then(setLogs).catch(() => {})
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise.id])

  const lastLog = logs[0]

  async function logSet(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post(`/exercises/${exercise.id}/logs`, {
        weight: parseDecimal(weight),
        sets: sets ? Number(sets) : null,
        reps: reps || null,
        note: logNote || null,
      })
      setWeight('')
      setSets('')
      setReps('')
      setLogNote('')
      refresh()
    } finally {
      setSaving(false)
    }
  }

  async function deleteLog(id: number) {
    await api.del(`/exercises/logs/${id}`)
    refresh()
  }

  async function saveExercise(payload: ExerciseFormValues) {
    await api.put(`/exercises/${exercise.id}`, payload)
    setEditingExercise(false)
    onUpdated?.()
  }

  async function deleteExercise() {
    if (!confirm(`Delete "${exercise.name}"? This also removes its logs.`)) return
    await api.del(`/exercises/${exercise.id}`)
    onDeleted?.()
  }

  async function copyToMySplit() {
    if (!copyTarget) return
    setCopyState('copying')
    try {
      await api.post(`/exercises/${exercise.id}/copy`, { targetDayId: Number(copyTarget) })
      setCopyState('done')
    } catch {
      setCopyState('idle')
    }
  }

  return (
    <div className="exercise-card">
      <button className="exercise-header" onClick={() => setExpanded((v) => !v)}>
        <div>
          <h4>{exercise.name}</h4>
          <p className="muted small">
            {exercise.target_sets ? `${exercise.target_sets} x ` : ''}
            {exercise.target_reps || '—'}
            {exercise.default_weight != null && ` · target ${exercise.default_weight}${exercise.weight_unit}`}
          </p>
        </div>
        <div className="exercise-last-chip">
          {owned ? (
            lastLog ? (
              <span className="chip" style={{ borderColor: user?.color }}>
                {lastLog.weight ?? '—'}
                {lastLog.weight_unit}
              </span>
            ) : (
              <span className="chip muted">Not logged yet</span>
            )
          ) : null}
          <span className="chevron">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="exercise-body">
          {owned && (
            <>
              {editingExercise ? (
                <>
                  <ExerciseForm
                    initial={exercise}
                    onCancel={() => setEditingExercise(false)}
                    onSave={saveExercise}
                  />
                  <button className="link-btn danger" onClick={deleteExercise}>
                    Delete exercise
                  </button>
                </>
              ) : (
                <div className="exercise-edit-toggle">
                  <button className="link-btn" onClick={() => setEditingExercise(true)}>
                    Edit exercise
                  </button>
                </div>
              )}
            </>
          )}

          {!editingExercise && exercise.cue && <p className="cue">💡 {exercise.cue}</p>}

          {!owned && (
            <div className="copy-row">
              {copyState === 'done' ? (
                <span className="muted small">✓ Copied to your split</span>
              ) : (
                <>
                  <select value={copyTarget} onChange={(e) => setCopyTarget(e.target.value)}>
                    <option value="">Copy to…</option>
                    {(myDays ?? []).map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.emoji} {d.name}
                      </option>
                    ))}
                  </select>
                  <button
                    className="link-btn"
                    disabled={!copyTarget || copyState === 'copying'}
                    onClick={copyToMySplit}
                  >
                    {copyState === 'copying' ? 'Copying…' : 'Copy exercise'}
                  </button>
                  {(myDays ?? []).length === 0 && (
                    <span className="muted small">Add a day to your split first</span>
                  )}
                </>
              )}
            </div>
          )}

          {!editingExercise && owned && (
            <>
              <form className="log-form" onSubmit={logSet} autoComplete="off">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder={`weight (${exercise.weight_unit})`}
                  value={weight}
                  onChange={(e) => setWeight(cleanDecimalInput(e.target.value))}
                />
                <input type="number" inputMode="numeric" placeholder="sets" value={sets} onChange={(e) => setSets(e.target.value)} />
                <input type="text" placeholder="reps" value={reps} onChange={(e) => setReps(e.target.value)} />
                <input
                  type="text"
                  placeholder="note (optional)"
                  value={logNote}
                  onChange={(e) => setLogNote(e.target.value)}
                  className="grow"
                />
                <button type="submit" className="primary small" disabled={saving}>
                  Log
                </button>
              </form>

              {logs.length > 0 && (
                <div className="log-history">
                  <label className="note-label">Recent logs</label>
                  <ul>
                    {logs.map((l) => (
                      <li key={l.id}>
                        <span className="log-date">{l.date}</span>
                        <span>
                          {l.weight ?? '—'}
                          {l.weight_unit} · {l.sets ?? '—'}x{l.reps ?? '—'}
                        </span>
                        {l.note && <span className="muted log-note">“{l.note}”</span>}
                        <button className="link-btn danger" onClick={() => deleteLog(l.id)}>
                          delete
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {!owned && logs.length > 0 && (
            <div className="log-history">
              <label className="note-label">Their recent logs</label>
              <ul>
                {logs.map((l) => (
                  <li key={l.id}>
                    <span className="log-date">{l.date}</span>
                    <span>
                      {l.weight ?? '—'}
                      {l.weight_unit} · {l.sets ?? '—'}x{l.reps ?? '—'}
                    </span>
                    {l.note && <span className="muted log-note">“{l.note}”</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
