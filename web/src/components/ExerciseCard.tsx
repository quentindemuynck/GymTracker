import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import type { Exercise, ExerciseLog, ExerciseNote } from '../types'

export function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const { user } = useAuth()
  const [logs, setLogs] = useState<ExerciseLog[]>([])
  const [notes, setNotes] = useState<ExerciseNote[]>([])
  const [myNoteDraft, setMyNoteDraft] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [weight, setWeight] = useState('')
  const [sets, setSets] = useState('')
  const [reps, setReps] = useState('')
  const [logNote, setLogNote] = useState('')
  const [saving, setSaving] = useState(false)

  function refresh() {
    api.get<ExerciseLog[]>(`/exercises/${exercise.id}/logs?limit=8`).then(setLogs).catch(() => {})
    api.get<ExerciseNote[]>(`/exercises/${exercise.id}/notes`).then((all) => {
      setNotes(all)
      const mine = all.find((n) => n.user_id === user?.id)
      setMyNoteDraft(mine?.note || '')
    })
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise.id])

  const lastMine = logs.find((l) => l.user_id === user?.id)
  const lastOthers = logs.filter((l) => l.user_id !== user?.id)

  async function logSet(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post(`/exercises/${exercise.id}/logs`, {
        weight: weight ? Number(weight) : null,
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

  async function saveNote() {
    await api.put(`/exercises/${exercise.id}/notes/me`, { note: myNoteDraft })
    refresh()
  }

  async function deleteLog(id: number) {
    await api.del(`/exercises/logs/${id}`)
    refresh()
  }

  const otherNotes = notes.filter((n) => n.user_id !== user?.id)

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
          {lastMine ? (
            <span className="chip" style={{ borderColor: user?.color }}>
              You: {lastMine.weight ?? '—'}
              {lastMine.weight_unit}
            </span>
          ) : (
            <span className="chip muted">Not logged yet</span>
          )}
          <span className="chevron">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="exercise-body">
          {exercise.cue && <p className="cue">💡 {exercise.cue}</p>}

          {lastOthers.length > 0 && (
            <div className="other-logs">
              {lastOthers.slice(0, 1).map((l) => (
                <span key={l.id} className="chip" style={{ borderColor: l.color }}>
                  {l.display_name}: {l.weight ?? '—'}
                  {l.weight_unit}
                </span>
              ))}
            </div>
          )}

          <form className="log-form" onSubmit={logSet}>
            <input
              type="number"
              step="0.25"
              placeholder={`weight (${exercise.weight_unit})`}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
            <input type="number" placeholder="sets" value={sets} onChange={(e) => setSets(e.target.value)} />
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

          <div className="notes-section">
            <label className="note-label">Your form notes</label>
            <textarea
              value={myNoteDraft}
              onChange={(e) => setMyNoteDraft(e.target.value)}
              placeholder="Things to watch out for with your form…"
              rows={2}
            />
            <button className="link-btn" onClick={saveNote}>
              Save note
            </button>

            {otherNotes.map((n) => (
              <div className="other-note" key={n.id}>
                <span className="dot" style={{ background: n.color }} /> <strong>{n.display_name}:</strong>{' '}
                {n.note}
              </div>
            ))}
          </div>

          {logs.length > 0 && (
            <div className="log-history">
              <label className="note-label">Recent logs</label>
              <ul>
                {logs.map((l) => (
                  <li key={l.id}>
                    <span className="dot" style={{ background: l.color }} />
                    <span className="log-date">{l.date}</span>
                    <span>
                      {l.display_name}: {l.weight ?? '—'}
                      {l.weight_unit} · {l.sets ?? '—'}x{l.reps ?? '—'}
                    </span>
                    {l.note && <span className="muted log-note">“{l.note}”</span>}
                    {l.user_id === user?.id && (
                      <button className="link-btn danger" onClick={() => deleteLog(l.id)}>
                        delete
                      </button>
                    )}
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
