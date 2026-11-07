import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { StatsRow } from '../components/StatsRow'
import type { Day, Session, User } from '../types'

export function TrackerPage() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [days, setDays] = useState<Day[]>([])
  const [filter, setFilter] = useState<'all' | number>('all')

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [dayId, setDayId] = useState<string>('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  function refresh() {
    const params = filter === 'all' ? '' : `?userId=${filter}`
    api.get<Session[]>(`/sessions${params}`).then(setSessions)
  }

  useEffect(() => {
    api.get<User[]>('/auth/users').then(setUsers)
    api.get<Day[]>('/days').then(setDays)
  }, [])

  useEffect(refresh, [filter])

  async function addSession(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/sessions', { date, dayId: dayId ? Number(dayId) : null, note: note || null })
      setNote('')
      refresh()
    } finally {
      setSaving(false)
    }
  }

  async function removeSession(id: number) {
    await api.del(`/sessions/${id}`)
    refresh()
  }

  return (
    <div className="page">
      <h1>Tracker</h1>
      <StatsRow users={users} />

      <h2 className="section-title">Log a gym day</h2>
      <form className="session-form" onSubmit={addSession}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <select value={dayId} onChange={(e) => setDayId(e.target.value)}>
          <option value="">Which day?</option>
          {days.map((d) => (
            <option value={d.id} key={d.id}>
              {d.emoji} {d.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="grow"
        />
        <button className="primary small" type="submit" disabled={saving}>
          Add
        </button>
      </form>

      <div className="tracker-filter">
        <button className={filter === 'all' ? 'chip-btn active' : 'chip-btn'} onClick={() => setFilter('all')}>
          Everyone
        </button>
        {users.map((u) => (
          <button
            key={u.id}
            className={filter === u.id ? 'chip-btn active' : 'chip-btn'}
            style={{ borderColor: u.color }}
            onClick={() => setFilter(u.id)}
          >
            {u.displayName}
          </button>
        ))}
      </div>

      <ul className="session-list">
        {sessions.map((s) => (
          <li key={s.id} className="session-item">
            <span className="dot" style={{ background: s.color }} />
            <span className="session-date">{s.date}</span>
            <strong>{s.display_name}</strong>
            {s.day_name && (
              <span className="chip">
                {s.day_emoji} {s.day_name}
              </span>
            )}
            {s.note && <span className="muted">“{s.note}”</span>}
            {s.user_id === user?.id && (
              <button className="link-btn danger" onClick={() => removeSession(s.id)}>
                delete
              </button>
            )}
          </li>
        ))}
        {sessions.length === 0 && <p className="muted">No sessions logged yet.</p>}
      </ul>
    </div>
  )
}
