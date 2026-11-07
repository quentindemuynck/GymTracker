import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { QuoteCard } from '../components/QuoteCard'
import { StatsRow } from '../components/StatsRow'
import type { Day } from '../types'

interface DayFormValues {
  name: string
  subtitle: string | null
  weekday: string | null
  emoji: string
}

function DayForm({
  initial,
  onCancel,
  onSave,
}: {
  initial?: Day
  onCancel: () => void
  onSave: (payload: DayFormValues) => Promise<void>
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? '')
  const [weekday, setWeekday] = useState(initial?.weekday ?? '')
  const [emoji, setEmoji] = useState(initial?.emoji ?? '🏋️')
  const [saving, setSaving] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({ name, subtitle: subtitle || null, weekday: weekday || null, emoji: emoji || '🏋️' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="entity-form" onSubmit={submit}>
      <div className="entity-form-row">
        <input
          placeholder="emoji"
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          className="emoji-input"
          maxLength={4}
        />
        <input
          placeholder="Day name (e.g. Push)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
          className="grow"
        />
      </div>
      <input placeholder="Weekday (optional, e.g. Monday)" value={weekday ?? ''} onChange={(e) => setWeekday(e.target.value)} />
      <input placeholder="Subtitle (optional)" value={subtitle ?? ''} onChange={(e) => setSubtitle(e.target.value)} />
      <div className="entity-form-actions">
        <button type="submit" className="primary small" disabled={saving}>
          Save
        </button>
        <button type="button" className="link-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

function DayCard({ day, onChanged }: { day: Day; onChanged: () => void }) {
  const [editing, setEditing] = useState(false)

  async function save(payload: DayFormValues) {
    await api.put(`/days/${day.id}`, payload)
    setEditing(false)
    onChanged()
  }

  async function remove() {
    if (!confirm(`Delete "${day.name}"? This also removes all its exercises, logs and notes.`)) return
    await api.del(`/days/${day.id}`)
    onChanged()
  }

  if (editing) {
    return (
      <div className="day-card day-card-editing">
        <DayForm initial={day} onCancel={() => setEditing(false)} onSave={save} />
        <button className="link-btn danger" onClick={remove}>
          Delete day
        </button>
      </div>
    )
  }

  return (
    <div className="day-card-wrap">
      <Link to={`/day/${day.id}`} className="day-card">
        <div className="day-card-emoji">{day.emoji}</div>
        <div>
          <h3>{day.name}</h3>
          {day.weekday && <p className="muted small">{day.weekday}</p>}
          {day.subtitle && <p className="muted">{day.subtitle}</p>}
          <p className="muted small">{day.exercises.length} exercises</p>
        </div>
      </Link>
      <button
        className="day-edit-btn"
        aria-label="Edit day"
        onClick={(e) => {
          e.preventDefault()
          setEditing(true)
        }}
      >
        ✏️
      </button>
    </div>
  )
}

function AddDayCard({ onAdded }: { onAdded: () => void }) {
  const [adding, setAdding] = useState(false)

  if (adding) {
    return (
      <div className="day-card day-card-editing">
        <DayForm
          onCancel={() => setAdding(false)}
          onSave={async (payload) => {
            await api.post('/days', payload)
            setAdding(false)
            onAdded()
          }}
        />
      </div>
    )
  }

  return (
    <button className="day-card day-card-add" onClick={() => setAdding(true)}>
      + Add day
    </button>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const [days, setDays] = useState<Day[]>([])
  const [loading, setLoading] = useState(true)

  function refresh() {
    api.get<Day[]>('/days').then(setDays)
  }

  useEffect(() => {
    api
      .get<Day[]>('/days')
      .then(setDays)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="page-loading">Loading…</div>

  return (
    <div className="page">
      <QuoteCard />
      {user && <StatsRow users={[user]} />}

      <div className="section-title-row">
        <h2 className="section-title">Your split</h2>
        <Link to="/templates" className="link-btn">
          Browse templates
        </Link>
      </div>
      <div className="day-grid">
        {days.map((day) => (
          <DayCard key={day.id} day={day} onChanged={refresh} />
        ))}
        <AddDayCard onAdded={refresh} />
      </div>
      {days.length === 0 && (
        <p className="muted">
          Your split is empty — add a day above, or <Link to="/templates">start from a template</Link>.
        </p>
      )}
    </div>
  )
}
