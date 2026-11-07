import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Day } from '../types'

export function TemplatesPage() {
  const [templates, setTemplates] = useState<Day[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<Day[]>('/days/templates')
      .then(setTemplates)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="page-loading">Loading…</div>

  return (
    <div className="page">
      <Link to="/" className="back-link">
        ← Back
      </Link>
      <h1>Templates</h1>
      <p className="muted">Starter splits you can copy into your own account and then customize freely.</p>

      <div className="day-grid">
        {templates.map((day) => (
          <Link to={`/day/${day.id}`} key={day.id} className="day-card">
            <div className="day-card-emoji">{day.emoji}</div>
            <div>
              <h3>{day.name}</h3>
              {day.weekday && <p className="muted small">{day.weekday}</p>}
              {day.subtitle && <p className="muted">{day.subtitle}</p>}
              <p className="muted small">{day.exercises.length} exercises</p>
            </div>
          </Link>
        ))}
        {templates.length === 0 && <p className="muted">No templates available yet.</p>}
      </div>
    </div>
  )
}
